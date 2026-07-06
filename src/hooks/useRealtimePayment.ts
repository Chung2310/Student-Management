import { useEffect } from "react";
import { useAuth } from "./useAuth";
import { useToast } from "./useToast";

export function useRealtimePayment() {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) return;

    const token = localStorage.getItem("accessToken");
    if (!token) return;

    // Thiết lập kết nối SSE với Token truyền qua query
    const eventSource = new EventSource(`/api/v1/events?token=${token}`);

    eventSource.addEventListener("connected", (e: MessageEvent) => {
      try {
        JSON.parse(e.data);
      } catch (err) {
        console.error("[SSE] Error parsing connection event:", err);
      }
    });

    eventSource.addEventListener("payment-received", (e: MessageEvent) => {
      try {
        const data = JSON.parse(e.data);

        // Kích hoạt các sự kiện mutation để reload danh sách học viên & học phí
        window.dispatchEvent(new Event("student-mutation"));
        window.dispatchEvent(new Event("payment-mutation"));

        // Hiển thị thông báo Toast
        toast.success(`💸 Đã nhận tự động ${data.amount} từ học viên ${data.studentName}!`);
      } catch (err) {
        console.error("[SSE] Error parsing payment event data:", err);
      }
    });

    eventSource.onerror = (err) => {
      console.error("[SSE] Connection error. Closing connection:", err);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, [user, toast]);
}
