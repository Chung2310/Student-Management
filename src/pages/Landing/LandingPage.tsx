import React, { useState } from 'react';
import {
  GraduationCap, Users, CreditCard, Bot, Sparkles, CheckCircle2,
  ArrowRight, Shield, Activity, Calendar, Award, BookOpen,
  MessageSquare, Menu, X, ArrowUpRight
} from 'lucide-react';
import { motion } from 'motion/react';

interface LandingPageProps {
  onNavigateToLogin: () => void;
  onNavigateToPath: (path: string) => void;
}

type IndustryType = 'driving' | 'languages' | 'tutoring' | 'vocational';

interface IndustrySolution {
  title: string;
  desc: string;
  badge: string;
  benefits: string[];
  metrics: { label: string; value: string }[];
}

export function LandingPage({ onNavigateToLogin, onNavigateToPath }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<IndustryType>('driving');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);


  const industries: Record<IndustryType, IndustrySolution> = {
    driving: {
      title: 'Đào tạo & Sát hạch Lái xe',
      desc: 'Quản lý hồ sơ thi cử chuyên nghiệp, quản lý dữ liệu kiểm tra sức khỏe (KSK), theo dõi sát sao tiến độ học lý thuyết, thực hành (DAT), thời gian học cabin và kết quả thi sát hạch.',
      badge: 'B1, B2, C, A1, A2',
      benefits: [
        'Tự động hóa theo dõi tiến độ thi và nộp hồ sơ KSK.',
        'Quản lý chi tiết học phí chia thành nhiều đợt đóng.',
        'Nhắc lịch thi sát hạch và lịch tập qua Zalo/SMS Bot.'
      ],
      metrics: [
        { label: 'Tỷ lệ thi đỗ', value: '92%' },
        { label: 'Thời gian giảm tải', value: '40%' }
      ]
    },
    languages: {
      title: 'Trung tâm Ngoại ngữ & Kỹ năng',
      desc: 'Sắp xếp thời khóa biểu giảng dạy, theo dõi chuyên cần (điểm danh), ghi nhận điểm số định kỳ và quản lý thông tin chứng chỉ đầu ra (IELTS, HSK, TOPIK,...).',
      badge: 'Anh - Trung - Nhật - Hàn',
      benefits: [
        'Theo dõi tiến độ học tập và chuyên cần của từng học sinh.',
        'Phụ huynh dễ dàng theo dõi kết quả học tập trực tuyến.',
        'Quản lý lương giảng viên dựa trên ca dạy thực tế.'
      ],
      metrics: [
        { label: 'Học viên hài lòng', value: '98%' },
        { label: 'Giao tiếp phụ huynh', value: 'X5' }
      ]
    },
    tutoring: {
      title: 'Lớp học thêm & Gia sư',
      desc: 'Tối ưu hóa khâu thu học phí hàng tháng thông qua hệ thống VietQR động, gửi hóa đơn điện tử tự động và kết nối thông báo tình hình học tập trực tiếp tới phụ huynh.',
      badge: 'Toán, Lý, Hóa, Văn, Anh',
      benefits: [
        'Quét mã VietQR chuyển khoản học phí tự động gạch nợ.',
        'Quản lý nhóm học sinh theo trình độ và khối lớp.',
        'Hệ thống AI gợi ý bài tập nâng cao cho học sinh.'
      ],
      metrics: [
        { label: 'Thu phí tự động', value: '100%' },
        { label: 'Tiết kiệm thời gian', value: '15h/tuần' }
      ]
    },
    vocational: {
      title: 'Trường nghề & Đào tạo ngắn hạn',
      desc: 'Theo dõi chặt chẽ tiến độ tích lũy module/tín chỉ, phân bổ danh sách lớp thực hành xưởng và cấp chứng chỉ nghề tự động khi hoàn thành chương trình học.',
      badge: 'Chứng chỉ - Trung cấp - Cao đẳng',
      benefits: [
        'Quản lý phân hệ học tập lý thuyết kết hợp thực hành.',
        'Tự động kiểm tra điều kiện tốt nghiệp của học viên.',
        'Kết nối thông tin tuyển dụng trực tiếp tới doanh nghiệp.'
      ],
      metrics: [
        { label: 'Học viên có việc làm', value: '85%' },
        { label: 'Tự động hóa quản trị', value: '60%' }
      ]
    }
  };

  const scrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-cyan-500 selection:text-white">
      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600 flex items-center justify-center shadow-md shadow-cyan-600/20">
              <GraduationCap className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-lg font-black text-slate-900 tracking-tight block leading-none">IGEN</span>
              <span className="text-[9px] font-bold text-cyan-600 uppercase tracking-widest mt-0.5 block">Student Management</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-cyan-600 transition-colors">Tính năng</a>
            <a href="#solutions" className="hover:text-cyan-600 transition-colors">Giải pháp</a>
            <button 
              onClick={() => onNavigateToPath('/lookup')}
              className="hover:text-cyan-600 transition-colors cursor-pointer bg-transparent border-none p-0 text-sm font-semibold text-slate-600"
            >
              Tra cứu kết quả
            </button>
            <a href="#stats" className="hover:text-cyan-600 transition-colors">Số liệu</a>
          </nav>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={onNavigateToLogin}
              className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-xl text-xs font-bold shadow-md shadow-cyan-100 hover:shadow-cyan-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              Đăng nhập <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Mobile Menu Btn */}
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu Panel */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden border-b border-slate-200 bg-white px-6 py-4 space-y-4"
          >
            <a href="#features" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600">Tính năng</a>
            <a href="#solutions" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600">Giải pháp</a>
            <button 
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigateToPath('/lookup');
              }} 
              className="block w-full text-left text-sm font-bold text-slate-600 bg-transparent border-none p-0 cursor-pointer"
            >
              Tra cứu kết quả
            </button>
            <a href="#stats" onClick={() => setIsMobileMenuOpen(false)} className="block text-sm font-bold text-slate-600">Số liệu</a>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                onNavigateToLogin();
              }}
              className="w-full py-3 bg-cyan-600 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-1.5"
            >
              Đăng nhập <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-24 lg:pt-20 lg:pb-32 overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50">
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-cyan-600/10 blur-[150px] rounded-full" />
          <div className="absolute bottom-[20%] right-[-10%] w-[55%] h-[55%] bg-indigo-600/5 blur-[150px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center relative z-10">
          {/* Hero Content */}
          <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-50 border border-cyan-100 text-[10px] sm:text-xs font-bold text-cyan-700 uppercase tracking-widest shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-cyan-600 animate-pulse" />
              Tất cả trong một nền tảng thông minh
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight leading-[1.1] text-balance">
              Hệ thống Quản lý <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-indigo-600">
                Học viên Toàn diện
              </span>
            </h1>

            <p className="text-slate-500 text-base sm:text-lg lg:text-xl font-medium leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Giải pháp tối ưu dành cho các trung tâm đào tạo, lớp dạy thêm, trường dạy nghề và trung tâm ngoại ngữ. Quản lý thông tin, học phí VietQR và tiến độ thông minh chỉ trên một nền tảng duy nhất.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4">
              <button
                onClick={onNavigateToLogin}
                className="w-full sm:w-auto px-8 py-4 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold shadow-lg shadow-cyan-100 hover:shadow-cyan-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                Trải nghiệm ngay <ArrowRight className="w-4 h-4" />
              </button>
              <button
                onClick={scrollToFeatures}
                className="w-full sm:w-auto px-8 py-4 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl font-bold shadow-sm hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                Tìm hiểu thêm
              </button>
            </div>
          </div>

          {/* Hero Visual Mockup */}
          <div className="lg:col-span-5 relative flex justify-center">
            <div className="w-full max-w-[450px] aspect-[4/5] bg-gradient-to-br from-cyan-50 to-indigo-50 border border-slate-200 rounded-[2.5rem] p-6 shadow-2xl relative">
              <div className="absolute inset-0 bg-white/30 backdrop-blur-[2px] rounded-[2.5rem]" />

              <div className="relative space-y-5 h-full flex flex-col justify-between z-10">
                {/* Simulated Header */}
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <span className="text-xs font-black text-slate-800 uppercase tracking-wider">Bảng điều khiển IGEN</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                </div>

                {/* Floating Mock Stats */}
                <div className="space-y-4 flex-1 flex flex-col justify-center">
                  {/* Card 1 */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="p-4 bg-white border border-slate-100 rounded-2xl shadow-md flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học viên đang học</p>
                      <p className="text-lg font-black text-slate-800">1,248 học viên</p>
                    </div>
                  </motion.div>

                  {/* Card 2 */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="p-4 bg-white border border-slate-100 rounded-2xl shadow-md flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                      <CreditCard className="w-5 h-5" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Học phí tháng này</p>
                        <span className="text-xs font-black text-emerald-600">85%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-2 rounded-full mt-1.5 overflow-hidden">
                        <div className="bg-emerald-500 h-full rounded-full w-[85%]" />
                      </div>
                    </div>
                  </motion.div>

                  {/* Card 3 */}
                  <motion.div
                    whileHover={{ scale: 1.03 }}
                    className="p-4 bg-white border border-slate-100 rounded-2xl shadow-md flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Zalo/SMS Auto Bot</p>
                      <p className="text-xs font-bold text-slate-600 mt-0.5">Đã nhắc lịch thi & học phí cho 542 học viên</p>
                    </div>
                  </motion.div>
                </div>

                {/* Bottom badge */}
                <div className="bg-cyan-900 text-white rounded-2xl p-3 text-center text-xs font-bold flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" />
                  Học viên tự động đăng ký qua mã VietQR
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Solutions by Industry Section */}
      <section id="solutions" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Giải pháp đa ngành</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Đáp ứng trọn vẹn nhu cầu của mọi loại hình đào tạo
            </h3>
            <p className="text-slate-500 font-medium">
              Không chỉ giới hạn trong một ngành nghề, IGEN được thiết kế linh động để phù hợp với mọi trung tâm dạy học, đào tạo kỹ năng hoặc trường nghề ngắn hạn.
            </p>
          </div>

          {/* Industry Tabs */}
          <div className="flex flex-wrap justify-center gap-2 mb-12 border-b border-slate-100 pb-6">
            {(Object.keys(industries) as IndustryType[]).map((key) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-3 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
                  activeTab === key
                    ? 'bg-cyan-600 text-white shadow-md shadow-cyan-600/10'
                    : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/60'
                }`}
              >
                {key === 'driving' && <Activity className="w-4 h-4" />}
                {key === 'languages' && <BookOpen className="w-4 h-4" />}
                {key === 'tutoring' && <MessageSquare className="w-4 h-4" />}
                {key === 'vocational' && <Award className="w-4 h-4" />}
                {industries[key].title}
              </button>
            ))}
          </div>

          {/* Active Tab Solution Detail */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-slate-50 rounded-[2.5rem] p-8 lg:p-12 border border-slate-200/50">
            {/* Left Detail */}
            <div className="lg:col-span-7 space-y-6">
              <span className="px-3 py-1 rounded bg-white text-[10px] text-cyan-600 font-bold border border-slate-200">
                {industries[activeTab].badge}
              </span>
              <h4 className="text-2xl font-black text-slate-900 tracking-tight">
                {industries[activeTab].title}
              </h4>
              <p className="text-slate-500 font-medium leading-relaxed text-sm">
                {industries[activeTab].desc}
              </p>

              <div className="space-y-3 pt-2">
                {industries[activeTab].benefits.map((benefit, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                    <span className="text-sm font-semibold text-slate-700">{benefit}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Metrics */}
            <div className="lg:col-span-5 grid grid-cols-2 gap-4 lg:pl-8">
              {industries[activeTab].metrics.map((metric, i) => (
                <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200/60 text-center shadow-sm">
                  <span className="text-3xl font-black text-cyan-600 block mb-1">{metric.value}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{metric.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Core Features Grid */}
      <section id="features" className="py-24 bg-slate-100/50 border-y border-slate-200/60">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-bold text-cyan-600 uppercase tracking-widest">Tính năng nổi bật</h2>
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Quản trị thông minh - Vận hành nhàn nhã
            </h3>
            <p className="text-slate-500 font-medium">
              Tích hợp mọi công cụ thiết yếu để bạn số hóa toàn bộ trung tâm của mình, loại bỏ giấy tờ phức tạp.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <FeatureCard
              icon={Users}
              title="Quản lý Hồ sơ Điện tử"
              desc="Lưu trữ thông tin chi tiết học viên kèm ảnh chân dung, ảnh thẻ CCCD mặt trước và mặt sau rõ ràng, khoa học."
            />
            {/* Feature 2 */}
            <FeatureCard
              icon={CreditCard}
              title="VietQR & Đóng phí Linh hoạt"
              desc="Tự động sinh mã VietQR theo đợt thu học phí, gạch nợ tự động ngay sau khi nhận tiền từ tài khoản học viên."
            />
            {/* Feature 3 */}
            <FeatureCard
              icon={Calendar}
              title="Theo dõi Tiến độ học & thi"
              desc="Quản lý lịch học, xếp lớp lý thuyết, lớp thực hành và cập nhật kết quả thi sát hạch nhanh chóng, chính xác."
            />
            {/* Feature 4 */}
            <FeatureCard
              icon={Bot}
              title="BOT thông báo tự động"
              desc="Tự động nhắc nhở đóng học phí, lịch học, lịch kiểm tra qua Zalo/SMS giúp giảm thiểu nợ đọng hiệu quả."
            />
            {/* Feature 5 */}
            <FeatureCard
              icon={Sparkles}
              title="Trợ lý AI Gemini thông minh"
              desc="Tích hợp AI đàm thoại giúp giải đáp, phản hồi nhanh chóng và hỗ trợ phân loại học viên cực kỳ hiệu quả."
            />
            {/* Feature 6 */}
            <FeatureCard
              icon={Shield}
              title="Bảo mật & Phân quyền"
              desc="Phân quyền quản lý chặt chẽ giữa Giáo viên, Giáo vụ và Quản trị viên (Superadmin) của trung tâm."
            />
          </div>
        </div>
      </section>

      {/* Stats Counter Section */}
      <section id="stats" className="py-20 bg-cyan-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-[20%] right-[-10%] w-[40%] h-[60%] bg-cyan-500/10 blur-[120px] rounded-full" />
        </div>

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-8 text-center relative z-10">
          <div className="space-y-2">
            <span className="text-4xl sm:text-5xl font-black block tracking-tight">10K+</span>
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Học viên quản lý</span>
          </div>
          <div className="space-y-2">
            <span className="text-4xl sm:text-5xl font-black block tracking-tight">98%</span>
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Tự động hóa quy trình</span>
          </div>
          <div className="space-y-2">
            <span className="text-4xl sm:text-5xl font-black block tracking-tight">X2.5</span>
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Hiệu suất tuyển sinh</span>
          </div>
          <div className="space-y-2">
            <span className="text-4xl sm:text-5xl font-black block tracking-tight">24/7</span>
            <span className="text-[10px] font-bold text-cyan-200 uppercase tracking-widest">Hỗ trợ kỹ thuật</span>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-24 bg-white border-t border-slate-200/50">
        <div className="max-w-5xl mx-auto px-6 text-center space-y-8">
          <h3 className="text-3xl sm:text-5xl font-black text-slate-900 tracking-tight leading-none">
            Sẵn sàng tối ưu hóa quản lý trung tâm của bạn?
          </h3>
          <p className="text-slate-500 text-base sm:text-lg font-medium max-w-2xl mx-auto">
            Hàng trăm trung tâm đào tạo lái xe, ngoại ngữ và lớp dạy thêm đang vận hành trơn tru hơn nhờ hệ thống quản trị của chúng tôi. Hãy bắt đầu ngay hôm nay!
          </p>
          <div className="flex justify-center">
            <button
              onClick={onNavigateToLogin}
              className="px-10 py-5 bg-cyan-600 hover:bg-cyan-700 text-white rounded-2xl font-bold shadow-xl shadow-cyan-100 hover:shadow-cyan-200/50 hover:-translate-y-0.5 active:translate-y-0 active:scale-98 transition-all flex items-center gap-2 cursor-pointer text-base"
            >
              Tạo tài khoản & Bắt đầu <ArrowUpRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </section>

      {/* Unified Footer */}
      <footer className="bg-slate-950 text-slate-400 py-12 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <span className="text-sm font-black text-white tracking-wider">IGEN STUDENT MANAGEMENT</span>
          </div>
          
          <div className="flex flex-col items-center md:items-end gap-3">
            <div className="flex items-center gap-4 text-xs font-semibold">
              <button 
                onClick={() => onNavigateToPath('/terms')} 
                className="hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Điều khoản dịch vụ
              </button>
              <span className="text-slate-700">|</span>
              <button 
                onClick={() => onNavigateToPath('/privacy')} 
                className="hover:text-cyan-400 transition-colors cursor-pointer bg-transparent border-none p-0"
              >
                Chính sách bảo mật
              </button>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-center md:text-right">
              &copy; 2026 IGEN • Hệ thống Quản lý Đào tạo & Học viên thông minh
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  desc: string;
}

function FeatureCard({ icon: Icon, title, desc }: FeatureCardProps) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-white p-8 rounded-3xl border border-slate-200/60 shadow-sm hover:shadow-md transition-all space-y-4"
    >
      <div className="w-12 h-12 rounded-2xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
        <Icon className="w-6 h-6" />
      </div>
      <h4 className="text-lg font-bold text-slate-800">{title}</h4>
      <p className="text-slate-500 font-medium text-xs sm:text-sm leading-relaxed">{desc}</p>
    </motion.div>
  );
}
