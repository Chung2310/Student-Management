import { HelpCircle } from 'lucide-react';

interface GeneralCenterGuideProps {
  activeSection: string;
  searchQuery: string;
}

export function GeneralCenterGuide({ activeSection, searchQuery }: GeneralCenterGuideProps) {
  const highlightText = (text: string) => {
    if (!searchQuery) return text;
    const parts = text.split(new RegExp(`(${searchQuery})`, 'gi'));
    return (
      <>
        {parts.map((part, i) => 
          part.toLowerCase() === searchQuery.toLowerCase() 
            ? <mark key={i} className="bg-yellow-100 text-yellow-900 rounded px-0.5 font-bold">{part}</mark>
            : part
        )}
      </>
    );
  };

  const renderSection = () => {
    switch (activeSection) {
      case 'quickstart':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🚀 Quy trình 5 bước vận hành nhanh cho Trung tâm</h3>
              <p className="text-slate-500 text-sm mt-1">Lộ trình 5 bước tiêu chuẩn giúp nhân viên vận hành nhanh phần mềm từ bước tạo khóa học đến khi điểm danh.</p>
            </div>

            <div className="relative border-l-2 border-emerald-100 ml-4 pl-6 space-y-8 my-6">
              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">1</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Tạo Khóa học")}</h4>
                <p className="text-slate-400 text-xs mt-1">Truy cập menu <strong>Khóa học</strong> ➜ Bấm <strong>+ Tạo khóa học</strong> ➜ Điền các thông tin: Mã khóa học, Tên khóa học, Phân loại, Học phí tiêu chuẩn và Số buổi dạy định mức.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">2</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Thêm Học viên mới")}</h4>
                <p className="text-slate-400 text-xs mt-1">Truy cập menu <strong>Học viên</strong> ➜ Bấm <strong>+ Thêm học viên</strong> ➜ Nhập Họ tên, Số điện thoại và Email của học viên. Hệ thống sẽ tự động gạch nợ học phí theo khóa học đăng ký.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">3</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Mở Lớp học")}</h4>
                <p className="text-slate-400 text-xs mt-1">Truy cập menu <strong>Lớp & Khai giảng</strong> ➜ Bấm <strong>+ Tạo lớp học mới</strong> ➜ Chọn Khóa học liên kết, chỉ định Giáo viên phụ trách, xếp Phòng học và thiết lập Thời khóa biểu cố định trong tuần.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">4</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Xếp Lớp học viên (Ghi danh)")}</h4>
                <p className="text-slate-400 text-xs mt-1">Click xem chi tiết Lớp học vừa tạo ở Bước 3 ➜ Bấm <strong>Ghi danh học viên</strong> ➜ Chọn các học viên tương ứng trong danh sách học viên rảnh để đưa vào lớp học chính thức.</p>
              </div>

              <div className="relative">
                <div className="absolute -left-10 top-0 w-8 h-8 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-emerald-100">5</div>
                <h4 className="font-bold text-slate-800 text-sm">{highlightText("Điểm danh chuyên cần")}</h4>
                <p className="text-slate-400 text-xs mt-1">Trong chi tiết lớp học ➜ Chọn tab <strong>Điểm danh</strong> ➜ Bấm <strong>Tạo buổi điểm danh</strong> ➜ Chọn trạng thái đi học (Có mặt, Vắng phép, Vắng không phép) cho từng học viên.</p>
              </div>
            </div>
          </div>
        );

      case 'dashboard':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">📊 Tổng quan (Dashboard)</h3>
              <p className="text-slate-500 text-sm mt-1">Trang chủ quản trị giúp giám sát tình hình vận hành của trung tâm đào tạo tức thời.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Các chỉ số thống kê nhanh ở đầu trang:")}</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Học viên đang học:</strong> Tổng số lượng học viên có trạng thái học tập là "Đang học" và được ghi danh vào ít nhất một lớp học hoạt động.</li>
                <li><strong>Doanh thu tháng này:</strong> Tổng số tiền thực thu từ học phí của tất cả học viên trong tháng hiện tại (dựa trên bộ lọc ngày thu học phí).</li>
                <li><strong>Buổi học hôm nay:</strong> Tổng số ca học được xếp lịch diễn ra trong ngày hôm nay.</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Widget Lịch học hôm nay:")}</h4>
              <p>Hiển thị chi tiết theo dòng thời gian các ca dạy học của ngày hiện tại, bao gồm: giờ bắt đầu - giờ kết thúc, tên lớp học, giảng viên giảng dạy và phòng học được phân công. Người dùng có thể click trực tiếp vào ca học trên widget này để chuyển hướng nhanh đến trang điểm danh của lớp đó.</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Biểu đồ tăng trưởng tuyển sinh:")}</h4>
              <p>Biểu đồ cột trực quan hóa số lượng học viên mới đăng ký nhập học theo từng tháng (trong vòng 6 tháng gần nhất) để theo dõi hiệu quả tuyển sinh.</p>
            </div>
          </div>
        );

      case 'students':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">👥 Quản lý Học viên</h3>
              <p className="text-slate-500 text-sm mt-1">Module cốt lõi dùng để lưu trữ hồ sơ, quản lý tình trạng học tập, học phí và lịch sử hoạt động của học viên.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Hướng dẫn thêm học viên mới:")}</h4>
              <p>Bấm nút <strong>+ Thêm học viên</strong> ở đầu trang để mở hộp thoại. Điền thông tin vào các trường sau:</p>
              
              <table className="min-w-full border border-slate-200 mt-2 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Tên trường thông tin</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Loại trường</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Bắt buộc / Ràng buộc dữ liệu</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Họ và tên</td>
                    <td className="border border-slate-200 px-3 py-2">Nhập text</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc nhập</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Số điện thoại</td>
                    <td className="border border-slate-200 px-3 py-2">Nhập số</td>
                    <td className="border border-slate-200 px-3 py-2 text-rose-600 font-bold">Bắt buộc. Phải đủ 10 số (đầu 03, 05, 07, 08, 09). Không trùng lặp.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Email học viên</td>
                    <td className="border border-slate-200 px-3 py-2">Nhập text</td>
                    <td className="border border-slate-200 px-3 py-2">Tùy chọn. Phải đúng định dạng email (ví dụ: name@domain.com). Không trùng lặp.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Ngày sinh</td>
                    <td className="border border-slate-200 px-3 py-2">Date picker</td>
                    <td className="border border-slate-200 px-3 py-2">Tùy chọn. Dùng để gửi thư chúc mừng sinh nhật học viên.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">CCCD / CMND</td>
                    <td className="border border-slate-200 px-3 py-2">Nhập số</td>
                    <td className="border border-slate-200 px-3 py-2">Tùy chọn. Phải gồm 9 hoặc 12 chữ số. Không trùng lặp.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Khóa học đăng ký</td>
                    <td className="border border-slate-200 px-3 py-2">Dropdown select</td>
                    <td className="border border-slate-200 px-3 py-2">Bắt buộc. Chọn khóa học sẽ tự động điền Học phí định mức tương ứng.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Ngày nhập học</td>
                    <td className="border border-slate-200 px-3 py-2">Date picker</td>
                    <td className="border border-slate-200 px-3 py-2">Tùy chọn. Mặc định tự động điền ngày hôm nay nếu để trống.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Học phí (VND)</td>
                    <td className="border border-slate-200 px-3 py-2">Nhập số</td>
                    <td className="border border-slate-200 px-3 py-2">Hệ thống tự động định dạng tiền tệ khi nhập. Có thể điều chỉnh giảm học phí cho học viên nếu có ưu đãi.</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Xem chi tiết & Quản lý bằng Tabs:")}</h4>
              <p>Bấm chọn tên học viên trên danh sách để mở hộp thoại Hồ sơ chi tiết. Tại đây thông tin chia làm các Tab:</p>
              
              <table className="min-w-full border border-slate-200 mt-2 rounded-xl overflow-hidden">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Tên Tab</th>
                    <th className="border border-slate-200 px-3 py-2 text-left font-bold text-[10px] uppercase">Nội dung chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Hồ sơ</td>
                    <td className="border border-slate-200 px-3 py-2">Hiển thị thông tin cá nhân cơ bản, địa chỉ, ảnh đại diện học viên. Cho phép chỉnh sửa thông tin.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Lịch thi & KQ</td>
                    <td className="border border-slate-200 px-3 py-2">Xem danh sách các bài kiểm tra định kỳ học viên đã làm và điểm số chi tiết của 4 kỹ năng (Nghe, Nói, Đọc, Viết) kèm điểm trung bình.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Học phí</td>
                    <td className="border border-slate-200 px-3 py-2">Hiển thị tổng số tiền phải đóng, số tiền đã nộp, dư nợ còn lại và danh sách lịch sử các biên lai thu tiền. Có thể trực tiếp thêm phiếu thu tiền học phí tại đây.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Lịch sử</td>
                    <td className="border border-slate-200 px-3 py-2">Nhật ký hệ thống ghi lại toàn bộ lịch sử thay đổi thông tin học viên, lịch sử chuyển lớp hoặc chuyển trạng thái học tập.</td>
                  </tr>
                  <tr>
                    <td className="border border-slate-200 px-3 py-2 font-semibold">Trợ lý AI</td>
                    <td className="border border-slate-200 px-3 py-2">Hệ thống AI tự động phân tích điểm thi và chuyên cần để sinh văn bản nhận xét kết quả học tập và khuyến nghị cải thiện cho học viên.</td>
                  </tr>
                </tbody>
              </table>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Nhập danh sách học viên từ file Excel:")}</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Bấm nút <strong>Nhập Excel</strong> trên trang danh sách học viên.</li>
                <li>Tải tệp mẫu Excel do hệ thống cung cấp về máy.</li>
                <li>Điền đầy đủ thông tin học viên theo đúng các tiêu đề cột (FullName, Phone, Email, Birthday, Address...).</li>
                <li>Tải tệp tin Excel đã điền dữ liệu lên hệ thống, xem bảng dữ liệu xem trước (Preview) để kiểm tra các hàng bị lỗi đỏ (lỗi trùng số điện thoại hoặc định dạng sai).</li>
                <li>Bấm <strong>Xác nhận lưu</strong> để nhập hàng loạt học viên vào cơ sở dữ liệu.</li>
              </ol>
            </div>
          </div>
        );

      case 'exams':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">📅 Quản lý Lịch thi</h3>
              <p className="text-slate-500 text-sm mt-1">Lên lịch các kỳ thi kiểm tra định kỳ, gán danh sách thí sinh và cập nhật điểm số thi cử.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Tạo kỳ thi mới:")}</h4>
              <p>Bấm nút <strong>+ Tạo kỳ thi mới</strong>. Nhập các thông tin bắt buộc:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Tên kỳ thi:</strong> Ví dụ "Kiểm tra cuối khóa IELTS K67".</li>
                <li><strong>Phân loại:</strong> Chọn Giữa kỳ, Cuối kỳ hoặc Kiểm tra định kỳ.</li>
                <li><strong>Ngày thi:</strong> Ngày diễn ra thi.</li>
                <li><strong>Địa điểm:</strong> Tên phòng thi hoặc phòng Lab tổ chức thi.</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Gán học viên vào kỳ thi:")}</h4>
              <p>Sau khi tạo kỳ thi ➜ Click chọn kỳ thi ➜ Bấm nút <strong>Gán học viên</strong> ➜ Tìm kiếm học viên theo tên hoặc theo lớp học ➜ Click chọn học viên để đưa vào danh sách dự thi của phòng thi đó.</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Nhập điểm và kết quả:")}</h4>
              <p>Tại bảng danh sách thí sinh dự thi: Trực tiếp nhập điểm cho từng học viên. Hỗ trợ nhập điểm 4 kỹ năng riêng biệt (Nghe, Nói, Đọc, Viết) từ 0 đến 10. Hệ thống sẽ tự động tính Điểm trung bình và hiển thị trạng thái kết quả Đạt hoặc Chưa đạt tương ứng với cấu hình điểm sàn đạt của khóa học.</p>
            </div>
          </div>
        );

      case 'fees':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">💵 Quản lý Học phí</h3>
              <p className="text-slate-500 text-sm mt-1">Theo dõi tình hình nợ phí của học viên và tiến hành lập phiếu thu học phí nhanh chóng.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Danh sách theo dõi học phí:")}</h4>
              <p>Bảng theo dõi hiển thị rõ ràng: Họ tên học viên, Khóa học đăng ký, Tổng học phí định mức, Số tiền thực tế học viên đã đóng, dư nợ còn thiếu và Trạng thái đóng học phí (được phân màu trực quan: Đã đóng đủ - xanh lá, Đóng một phần - cam, Chưa đóng phí - đỏ).</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Cách thực hiện thu tiền học phí:")}</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Tìm kiếm tên học viên cần đóng phí trên bảng học phí ➜ Bấm nút <strong>Đóng tiền</strong> ở cột cuối cùng.</li>
                <li>Trong form thu tiền:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><strong>Số tiền thu:</strong> Nhập số tiền thực nhận (VND).</li>
                    <li><strong>Phương thức đóng phí:</strong> Chọn "Tiền mặt" hoặc "Chuyển khoản".</li>
                    <li><strong>Ghi chú:</strong> Nhập thông tin bổ sung (ví dụ: Học viên đóng học phí đợt 1).</li>
                  </ul>
                </li>
                <li><strong>Quét mã VietQR động:</strong> Nếu chọn phương thức "Chuyển khoản" và hệ thống đã cấu hình thông tin VietQR, màn hình sẽ hiển thị mã QR động chứa thông tin tài khoản ngân hàng của trung tâm, số tiền cần chuyển và cú pháp nội dung chuyển khoản được định cấu hình tự động (như: <code>[Mã HV] [Họ tên] nop hoc phi</code>). Học viên chỉ cần quét mã bằng ứng dụng ngân hàng di động mà không cần nhập thủ công.</li>
                <li>Bấm <strong>Xác nhận thu tiền</strong> để hệ thống ghi nhận phiếu thu mới và tự động khấu trừ nợ của học viên.</li>
                <li>Bấm biểu tượng <strong>Máy in</strong> trên hàng lịch sử đóng phí để in biên lai học phí phát cho học viên.</li>
              </ol>
            </div>
          </div>
        );

      case 'bot':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🤖 BOT Thông báo</h3>
              <p className="text-slate-500 text-sm mt-1">Hệ thống gửi tin nhắn thông báo, nhắc nợ học phí và nhắc lịch thi tự động cho học viên hàng loạt qua Email và tin nhắn di động.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Hướng dẫn các bước soạn tin gửi hàng loạt:")}</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li><strong>Bộ lọc nhóm người nhận:</strong> Chọn 1 trong 4 nhóm đích muốn gửi:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><i>Tất cả học viên đang học:</i> Gửi thông báo chung lịch nghỉ lễ, thay đổi thời khóa biểu.</li>
                    <li><i>Học viên sắp thi:</i> Gửi nhắc nhở thời gian, địa điểm thi và số báo danh.</li>
                    <li><i>Học viên còn nợ học phí:</i> Gửi nhắc lịch đóng tiền học phí đợt tiếp theo.</li>
                    <li><i>Học viên cần thi lại:</i> Gửi thông báo đăng ký thi lại.</li>
                  </ul>
                </li>
                <li><strong>Kênh gửi tin:</strong> Email (gửi tự động qua cấu hình SMTP) hoặc SMS.</li>
                <li><strong>Sử dụng Nhãn biến động (Variables) để cá nhân hóa nội dung:</strong>
                  <p className="mt-1">Khi soạn thảo Tiêu đề và Nội dung tin nhắn, bạn có thể chèn các nhãn biến tự động sau. Hệ thống sẽ tự động thay đổi giá trị tương ứng của từng học viên khi gửi:</p>
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><code>{"{ten}"}</code>: Sẽ tự động chuyển thành Họ và tên của học viên.</li>
                    <li><code>{"{sotien}"}</code>: Tự động tính số tiền còn nợ học phí của học viên đó.</li>
                    <li><code>{"{ngaythi}"}</code>: Tự động chèn ngày thi gần nhất của học viên đó nếu có lịch thi.</li>
                    <li><code>{"{nhac_dong_phi}"}</code>: Chèn đoạn văn bản mẫu nhắc nhở đóng tiền chi tiết (Đã bao gồm gợi ý số tiền còn nợ học phí hoặc số tiền của đợt thanh toán hiện tại).</li>
                  </ul>
                </li>
                <li><strong>Kế hoạch thanh toán theo đợt (Installment Plan):</strong>
                  <p className="mt-1">Chức năng đặc biệt khi lọc gửi cho nhóm nợ học phí: Bật công tắc <strong>Kế hoạch đóng phí theo đợt</strong> ➜ Thêm số lượng đợt thu học phí và phân chia tỷ lệ phần trăm đóng tiền tương ứng giữa các đợt (ví dụ: Đợt 1: 50%, Đợt 2: 50%). Khi gửi thông báo đóng học phí đợt, hệ thống sẽ tự động tính số tiền đợt này <code>{"{tiendot}"}</code> bằng: (Tổng học phí × Tỷ lệ %) và chèn mã VietQR động chứa chính xác số tiền của đợt đóng đó vào Email gửi đi.</p>
                </li>
                <li>Bấm nút <strong>Gửi</strong> ➜ Hệ thống hiển thị hộp thoại chạy tiến độ (Progress Modal) hiển thị chi tiết số lượng tin đã gửi thành công / thất bại theo thời gian thực.</li>
              </ol>
            </div>
          </div>
        );

      case 'courses':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">📚 Quản lý Khóa học</h3>
              <p className="text-slate-500 text-sm mt-1">Cấu hình danh mục các chương trình đào tạo chính thức của trung tâm đào tạo.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Thiết lập khóa học đào tạo:")}</h4>
              <p>Bấm nút <strong>+ Tạo khóa học</strong> để thiết lập một chương trình học mới. Các trường thông tin bao gồm:</p>
              <ul className="list-disc pl-5 space-y-1">
                <li><strong>Mã khóa học:</strong> Ký hiệu viết tắt viết liền không dấu (Ví dụ: <code>TOEIC_500</code>).</li>
                <li><strong>Tên khóa học:</strong> Tên đầy đủ hiển thị (Ví dụ: "Luyện thi TOEIC 500+ Mục tiêu").</li>
                <li><strong>Phân loại:</strong> Phân nhóm khóa học (Tiếng Anh giao tiếp, IELTS, TOEIC...).</li>
                <li><strong>Học phí chuẩn:</strong> Số tiền học phí gốc (VND) của toàn bộ khóa học này.</li>
                <li><strong>Số lượng học viên tối đa:</strong> Sĩ số giới hạn của một lớp học mở theo khóa học này.</li>
                <li><strong>Số buổi học:</strong> Thời lượng tổng số buổi học của khóa học (dùng để kiểm soát tiến độ dạy học).</li>
              </ul>
            </div>
          </div>
        );

      case 'batches':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🏫 Lớp & Khai giảng</h3>
              <p className="text-slate-500 text-sm mt-1">Thiết lập các lớp học thực hành, lên lịch thời khóa biểu tuần cố định, phân giảng viên phụ trách và thực hiện điểm danh hàng ngày.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Tạo lớp học mới:")}</h4>
              <p>Bấm nút <strong>+ Tạo lớp học mới</strong> và điền thông tin vào các trường:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Tên lớp học:</strong> Đặt tên lớp phân biệt (Ví dụ: "Lớp IELTS 6.5 - Chiều T246").</li>
                <li><strong>Khóa học liên kết:</strong> Chọn khóa học đã tạo ở Module Khóa học để áp dụng chương trình.</li>
                <li><strong>Giảng viên & Phòng học:</strong> Gán giáo viên giảng dạy chính và chọn phòng học trống lịch.</li>
                <li><strong>Thời khóa biểu cố định trong tuần:</strong> Bấm chọn các thứ trong tuần (ví dụ: Thứ 2, Thứ 4, Thứ 6) và chọn khung giờ bắt đầu - giờ kết thúc học (ví dụ: 18:00 - 20:00). Hệ thống sẽ tự động quét trùng lịch giảng viên/phòng học và tự động tạo toàn bộ lịch học của khóa học đó trên trang chủ.</li>
              </ul>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Ghi danh học viên vào lớp:")}</h4>
              <p>Mở chi tiết lớp học ➜ Bấm nút <strong>Ghi danh học viên</strong> ở góc trên bên phải ➜ Hệ thống hiển thị danh sách toàn bộ học viên đăng ký khóa học này nhưng chưa được xếp lớp ➜ Tích chọn học viên ➜ Bấm <strong>Xác nhận</strong> để đưa học viên vào danh sách lớp học.</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Điểm danh và ghi nhận nội dung buổi học:")}</h4>
              <ol className="list-decimal pl-5 space-y-2">
                <li>Trong chi tiết lớp học, chọn tab <strong>Điểm danh</strong>.</li>
                <li>Bấm nút <strong>Tạo buổi điểm danh mới</strong> (Hệ thống tự động hiển thị ngày buổi học hiện tại).</li>
                <li>Tích chọn trạng thái đi học cho từng học viên trong danh sách:
                  <ul className="list-disc pl-5 mt-1 space-y-1">
                    <li><code>Có mặt (Present)</code>: Học viên đi học bình thường.</li>
                    <li><code>Vắng phép (Excused)</code>: Nghỉ học có lý do (không bị trừ số buổi chính thức).</li>
                    <li><code>Vắng không phép (Absent)</code>: Nghỉ học tự do.</li>
                  </ul>
                </li>
                <li>Nhập nội dung giảng dạy của buổi học hôm nay và ghi chú/bài tập về nhà nếu có.</li>
                <li>Bấm <strong>Lưu buổi điểm danh</strong>. Hệ thống tự động cập nhật số buổi học viên đã đi học và hiển thị phần trăm (%) chuyên cần ngay trong hồ sơ chi tiết học viên.</li>
              </ol>
            </div>
          </div>
        );

      case 'partners':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🤝 Đối tác & CTV</h3>
              <p className="text-slate-500 text-sm mt-1">Quản lý mạng lưới các đối tác giới thiệu học viên và các đại lý tuyển sinh liên kết.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Quản lý cộng tác viên và tính hoa hồng tuyển sinh:")}</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Thêm Đối tác / CTV:</strong> Bấm <strong>+ Thêm đối tác</strong>, nhập Họ tên, Số điện thoại, Cơ quan liên kết và cấu hình mức hoa hồng (tính theo số tiền cố định trên một học viên hoặc tính theo phần trăm (%) học phí thực tế học viên nộp).</li>
                <li><strong>Liên kết tuyển sinh:</strong> Khi thêm học viên mới, tại trường "Nguồn giới thiệu", chọn "Đối tác / CTV hệ thống" và chọn tên cộng tác viên giới thiệu.</li>
                <li><strong>Đối soát hoa hồng:</strong> Hệ thống tự động tính số tiền hoa hồng được nhận của đối tác dựa trên số tiền học phí học viên đã đóng thực tế. Hỗ trợ ghi nhận lịch sử chi trả tiền hoa hồng cho đối tác hàng tháng.</li>
              </ul>
            </div>
          </div>
        );

      case 'resources':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🏢 Quản lý Thiết bị & Phòng học</h3>
              <p className="text-slate-500 text-sm mt-1">Quản lý cơ sở vật chất phòng học và các tài sản trang thiết bị giảng dạy của trung tâm.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("Quản lý và đặt lịch sử dụng phòng học:")}</h4>
              <ul className="list-disc pl-5 space-y-2">
                <li><strong>Thêm cơ sở vật chất:</strong> Bấm <strong>+ Thêm thiết bị</strong>, nhập Mã định danh phòng học/thiết bị, Tên phòng (ví dụ: Phòng máy chiếu A1, Phòng Lab B2), mô tả thông số kỹ thuật và trạng thái hoạt động.</li>
                <li><strong>Tự động kiểm tra trùng lịch:</strong> Khi người dùng xếp lịch thời khóa biểu cho lớp học mới, hệ thống tự động đối chiếu thời gian của lớp học đó với lịch sử dụng của phòng học được chọn. Nếu phát hiện trùng lịch, hệ thống lập tức hiển thị cảnh báo đỏ ngăn chặn việc xếp trùng lịch phòng học.</li>
              </ul>
            </div>
          </div>
        );

      case 'usermanagement':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">🛡️ Quản lý Nhân sự & Giảng viên</h3>
              <p className="text-slate-500 text-sm mt-1">Cấp quyền truy cập tài khoản phần mềm cho đội ngũ giảng viên, trợ giảng, nhân viên tuyển sinh và kế toán trung tâm.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Tạo tài khoản nhân sự mới:")}</h4>
              <p>Bấm nút <strong>+ Thêm người dùng</strong> ➜ Nhập Họ tên, Địa chỉ Email (Email đăng nhập bằng Google) và chọn vai trò mặc định (Admin hoặc User).</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Cấu hình phân quyền chi tiết (Permissions):")}</h4>
              <p>Đối với tài khoản nhân sự (vai trò User hoặc Admin hệ thống), Super Admin có thể tích phân quyền truy cập cụ thể từng module trên hệ thống:</p>
              <ul className="list-disc pl-5 space-y-2">
                <li>Giảng viên dạy học chỉ được phân quyền xem mục <strong>Lớp & Khai giảng</strong> để thực hiện điểm danh lớp học được gán dạy, ẩn hoàn toàn thông tin tài chính doanh thu học phí.</li>
                <li>Kế toán trung tâm được phân quyền vào mục <strong>Học phí</strong> để thực hiện lập phiếu thu tiền học phí của học viên, ẩn các trang thiết lập quản trị hệ thống.</li>
                <li>Nhân viên tuyển sinh được phân quyền xem trang <strong>Học viên</strong> và <strong>Khóa học</strong> để thực hiện tiếp nhận học viên mới và tư vấn chương trình học.</li>
              </ul>
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">⚙️ Cài đặt & Quản trị Hệ thống</h3>
              <p className="text-slate-500 text-sm mt-1">Cấu hình tham số hệ thống, thông tin pháp lý của đơn vị đào tạo, thông tin ngân hàng thanh toán học phí và kết nối email tự động.</p>
            </div>

            <div className="space-y-4">
              <h4 className="font-bold text-slate-800 text-sm">{highlightText("1. Cài đặt thông tin trung tâm đào tạo:")}</h4>
              <p>Cập nhật tên trung tâm đào tạo, số điện thoại hotline, địa chỉ trụ sở chính và tải lên logo của trung tâm đào tạo hiển thị trên tiêu đề hóa đơn thu tiền và trang in báo cáo.</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("2. Cài đặt tài khoản thanh toán nhận học phí (VietQR):")}</h4>
              <p>Chọn tên Ngân hàng thụ hưởng (như Vietcombank, Techcombank, BIDV...), nhập Số tài khoản ngân hàng và Họ tên Chủ tài khoản. Định cấu hình mẫu tin nhắn cú pháp hiển thị trên VietQR tự động (Ví dụ: <code>{"[Mã HV] - [Họ tên] - nop hoc phi"}</code>) để tạo mã chuyển khoản học phí tự động chuẩn xác.</p>

              <h4 className="font-bold text-slate-800 text-sm mt-4">{highlightText("3. Kết nối Mail Server gửi tự động (SMTP Credentials):")}</h4>
              <p>Cấu hình máy chủ gửi Email SMTP của trung tâm bao gồm: Địa chỉ SMTP Server, SMTP Port, Email đăng nhập và Mật khẩu ứng dụng (App Password). Cấu hình này giúp BOT thông báo có thể gửi thư điện tử chứa mã hóa đơn và lịch thi tự động đến hòm thư cá nhân của học viên.</p>
            </div>
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-6 animate-fadeIn text-slate-600 text-xs leading-relaxed">
            <div>
              <h3 className="text-xl font-bold text-slate-900">❓ Câu hỏi thường gặp (FAQs)</h3>
              <p className="text-slate-500 text-sm mt-1">Các tình huống phát sinh thường gặp trong quá trình vận hành trung tâm và cách xử lý nhanh.</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                <h5 className="font-bold text-slate-800 text-xs">Q: Làm thế nào khi học viên xin bảo lưu hoặc rút học phí nghỉ học?</h5>
                <p className="text-slate-400 text-xs mt-1">A: Truy cập hồ sơ chi tiết học viên ➜ Tab Hồ sơ ➜ Đổi trạng thái học tập của học viên từ "Đang học" sang "Nghỉ học" hoặc "Bảo lưu". Đối với số tiền học phí rút lại: Hãy vào mục Học phí ➜ Thêm phiếu chi với số tiền âm tương ứng để ghi nhận lịch sử rút tiền học phí trong sổ quỹ.</p>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                <h5 className="font-bold text-slate-800 text-xs">Q: Tôi lỡ lưu phiếu điểm danh sai cho lớp học hôm qua, làm thế nào để sửa lại?</h5>
                <p className="text-slate-400 text-xs mt-1">A: Mở trang chi tiết Lớp học ➜ Chọn tab Điểm danh ➜ Tìm buổi học bị điểm danh sai ➜ Bấm vào để chỉnh sửa lại trạng thái đi học của học viên bị sai ➜ Bấm Lưu buổi điểm danh để hệ thống cập nhật và tính lại tỷ lệ chuyên cần cho học viên đó.</p>
              </div>

              <div className="p-4 bg-white border border-slate-100 rounded-2xl">
                <h5 className="font-bold text-slate-800 text-xs">Q: Tại sao tôi gửi email nhắc nợ học phí từ BOT nhưng học viên không nhận được?</h5>
                <p className="text-slate-400 text-xs mt-1">A: Vui lòng kiểm tra lại cấu hình SMTP Mail Server trong phần Cài đặt & Quản trị. Nếu tài khoản Gmail được dùng làm SMTP, bạn phải tạo và sử dụng Mật khẩu ứng dụng (App Password) chứ không được sử dụng mật khẩu đăng nhập tài khoản Google thông thường.</p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <HelpCircle size={40} className="stroke-1 mb-2 animate-bounce" />
            <p className="text-sm font-medium">Vui lòng chọn một mục hướng dẫn bên trái.</p>
          </div>
        );
    }
  };

  return (
    <div className="w-full">
      {renderSection()}
    </div>
  );
}
