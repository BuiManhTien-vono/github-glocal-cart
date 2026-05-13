import { Rocket, Shield, Globe, Users } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="bg-bg-main min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden bg-background">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10">
          <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[80%] bg-primary/10 dark:bg-primary/20 rounded-full blur-[160px]"></div>
          <div className="absolute bottom-[-20%] right-[-10%] w-[40%] h-[60%] bg-primary/5 dark:bg-primary/10 rounded-full blur-[140px]"></div>
        </div>

        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-soft rounded-full text-primary text-[10px] font-black mb-10 shadow-lg border border-primary/20 mx-auto backdrop-blur-md">
            <span className="tracking-[0.3em] uppercase">Câu Chuyện Của Chúng Tôi</span>
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter text-foreground mb-10 max-w-4xl mx-auto">
            KẾT NỐI <span className="text-primary italic">THẾ GIỚI</span> <br />
            MUA SẮM
          </h1>

          <p className="max-w-2xl mx-auto text-xl text-muted-foreground mb-12 leading-relaxed font-medium">
            GlocalCart ra đời với sứ mệnh mang đến trải nghiệm thương mại điện tử mượt mà, đẳng cấp, kết nối người mua và nhà bán hàng trên toàn quốc một cách an toàn và tiện lợi nhất.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { icon: Globe, title: "Toàn Cầu Hóa", desc: "Mạng lưới kết nối người bán và người mua không giới hạn." },
            { icon: Shield, title: "Bảo Mật 100%", desc: "Hệ thống thanh toán và dữ liệu được bảo vệ nghiêm ngặt." },
            { icon: Rocket, title: "Tốc Độ Cao", desc: "Giao diện và API siêu mượt, tối ưu trải nghiệm tức thì." },
            { icon: Users, title: "Cộng Đồng", desc: "Hỗ trợ và xây dựng cộng đồng mua sắm văn minh." }
          ].map((item, idx) => (
            <div key={idx} className="bg-card p-8 rounded-3xl border border-border shadow-xl hover:-translate-y-2 transition-transform duration-300">
              <div className="w-14 h-14 bg-primary/10 text-primary rounded-2xl flex items-center justify-center mb-6">
                <item.icon size={28} />
              </div>
              <h3 className="text-xl font-black text-foreground mb-3">{item.title}</h3>
              <p className="text-muted-foreground font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="container mx-auto px-4 mt-32">
        <div className="bg-foreground text-background rounded-[40px] p-12 md:p-20 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-96 h-96 bg-primary/30 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/20 blur-[100px] rounded-full"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10 text-center">
            <div>
              <div className="text-5xl md:text-7xl font-black mb-4">10K+</div>
              <div className="text-sm font-bold uppercase tracking-widest text-background/70">Sản phẩm</div>
            </div>
            <div>
              <div className="text-5xl md:text-7xl font-black mb-4">99%</div>
              <div className="text-sm font-bold uppercase tracking-widest text-background/70">Hài lòng</div>
            </div>
            <div>
              <div className="text-5xl md:text-7xl font-black mb-4">24/7</div>
              <div className="text-sm font-bold uppercase tracking-widest text-background/70">Hỗ trợ</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
