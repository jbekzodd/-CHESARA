const { useState, useEffect } = React;

function App() {
  const [activePage, setActivePage] = useState("dashboard");
  const [mobileMenu, setMobileMenu] = useState(false);

  const menu = [
    { id: "dashboard", icon: "📊", title: "Boshqaruv paneli" },
    { id: "students", icon: "🎓", title: "O‘quvchilar" },
    { id: "groups", icon: "👥", title: "Guruhlar" },
    { id: "lessons", icon: "♟️", title: "Darslar" },
    { id: "attendance", icon: "✅", title: "Davomat" },
    { id: "games", icon: "♞", title: "O‘yinlar" },
    { id: "analysis", icon: "🧠", title: "AI Tahlil" },
    { id: "tournaments", icon: "🏆", title: "Turnirlar" },
    { id: "news", icon: "📰", title: "Yangiliklar" },
    { id: "reports", icon: "📈", title: "Hisobotlar" },
  ];

  const stats = [
    {
      title: "O‘quvchilar",
      value: "0",
      icon: "🎓",
      text: "Faol o‘quvchilar",
    },
    {
      title: "Guruhlar",
      value: "0",
      icon: "👥",
      text: "Faol guruhlar",
    },
    {
      title: "Bugungi darslar",
      value: "0",
      icon: "♟️",
      text: "Rejalashtirilgan",
    },
    {
      title: "Davomat",
      value: "0%",
      icon: "✅",
      text: "Bugungi ko‘rsatkich",
    },
  ];

  const openPage = (page) => {
    setActivePage(page);
    setMobileMenu(false);
  };

  return (
    <div className="min-h-screen bg-[#07111f] text-white">

      {/* MOBILE HEADER */}
      <header className="lg:hidden sticky top-0 z-50 bg-[#0b1728]/95 backdrop-blur-xl border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => setMobileMenu(!mobileMenu)}
            className="w-10 h-10 rounded-xl bg-white/5 border border-white/10"
          >
            ☰
          </button>

          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center font-black">
              C
            </div>
            <span className="font-black tracking-wide">CHESARA</span>
          </div>

          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
            ♟
          </div>
        </div>
      </header>

      <div className="flex">

        {/* SIDEBAR */}
        <aside
          className={`
            fixed lg:sticky top-0 left-0 z-40
            h-screen w-[280px]
            bg-[#0a1627]
            border-r border-white/10
            flex flex-col
            transition-transform duration-300
            ${mobileMenu ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          `}
        >

          {/* LOGO */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-2xl font-black shadow-lg shadow-emerald-500/20">
                C
              </div>

              <div>
                <div className="text-xl font-black tracking-wider">
                  CHESARA
                </div>
                <div className="text-[10px] text-emerald-400 font-bold tracking-[0.2em] uppercase">
                  AI Chess Platform
                </div>
              </div>
            </div>
          </div>

          {/* USER */}
          <div className="p-4">
            <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
              <div className="text-xs text-slate-400 mb-1">
                Shaxmat markazi
              </div>

              <div className="font-bold">
                Mening akademiyam
              </div>

              <div className="flex items-center gap-2 mt-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                <span className="text-xs text-emerald-400">
                  Tizim faol
                </span>
              </div>
            </div>
          </div>

          {/* NAVIGATION */}
          <nav className="px-3 flex-1 overflow-y-auto">

            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-3">
              Asosiy boshqaruv
            </div>

            {menu.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => openPage(item.id)}
                className={`
                  w-full flex items-center gap-3
                  px-4 py-3
                  rounded-xl
                  mb-1
                  text-sm font-semibold
                  transition-all
                  ${
                    activePage === item.id
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.title}</span>
              </button>
            ))}

            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-4">
              Shaxmat
            </div>

            {menu.slice(5, 9).map((item) => (
              <button
                key={item.id}
                onClick={() => openPage(item.id)}
                className={`
                  w-full flex items-center gap-3
                  px-4 py-3
                  rounded-xl
                  mb-1
                  text-sm font-semibold
                  transition-all
                  ${
                    activePage === item.id
                      ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "text-slate-400 hover:bg-white/5 hover:text-white"
                  }
                `}
              >
                <span className="text-lg">{item.icon}</span>
                <span>{item.title}</span>
              </button>
            ))}

            <div className="text-[10px] uppercase tracking-widest text-slate-500 font-bold px-3 py-4">
              Hisobot
            </div>

            <button
              onClick={() => openPage("reports")}
              className={`
                w-full flex items-center gap-3
                px-4 py-3
                rounded-xl
                text-sm font-semibold
                ${
                  activePage === "reports"
                    ? "bg-emerald-500 text-white"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }
              `}
            >
              <span className="text-lg">📈</span>
              Hisobotlar
            </button>
          </nav>

          {/* BOTTOM */}
          <div className="p-4 border-t border-white/10">
            <div className="text-xs text-slate-500 mb-2">
              CHESARA
            </div>

            <div className="text-[11px] text-slate-600">
              AI Chess Management Platform
            </div>
          </div>
        </aside>

        {/* MAIN */}
        <main className="flex-1 min-w-0">

          {/* TOP BAR */}
          <div className="hidden lg:flex h-20 border-b border-white/10 bg-[#081425] items-center justify-between px-8">

            <div>
              <div className="text-sm text-slate-400">
                Shaxmat markazini boshqarish
              </div>

              <div className="font-bold text-lg">
                {menu.find((x) => x.id === activePage)?.title ||
                  "Boshqaruv paneli"}
              </div>
            </div>

            <div className="flex items-center gap-4">

              <button className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10">
                🔔
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500 flex items-center justify-center font-bold">
                  U
                </div>

                <div>
                  <div className="text-sm font-bold">
                    Ustoz
                  </div>
                  <div className="text-[10px] text-slate-500">
                    Murabbiy
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div className="p-4 md:p-8 max-w-[1500px] mx-auto">

            {activePage === "dashboard" && (
              <Dashboard stats={stats} openPage={openPage} />
            )}

            {activePage === "students" && (
              <SimplePage
                icon="🎓"
                title="O‘quvchilar"
                description="O‘quvchilarni ro‘yxatdan o‘tkazish, guruhlarga biriktirish va natijalarini kuzatish."
              />
            )}

            {activePage === "groups" && (
              <SimplePage
                icon="👥"
                title="Guruhlar"
                description="Guruhlar, murabbiylar, dars jadvali va o‘quvchilarni boshqarish."
              />
            )}

            {activePage === "lessons" && (
              <SimplePage
                icon="♟️"
                title="Darslar"
                description="Bugungi darslar, jonli darslar va dars tarixini boshqarish."
              />
            )}

            {activePage === "attendance" && (
              <SimplePage
                icon="✅"
                title="Davomat"
                description="Ustoz va o‘quvchi davomatini avtomatik nazorat qilish."
              />
            )}

            {activePage === "games" && (
              <SimplePage
                icon="♞"
                title="O‘yinlar"
                description="Lichess, Chess.com, Telegram va boshqa manbalardagi o‘yinlarni tahlil qilish."
              />
            )}

            {activePage === "analysis" && (
              <SimplePage
                icon="🧠"
                title="AI Tahlil"
                description="O‘quvchining o‘yin uslubi, xatolari, kuchli tomonlari va rivojlanish yo‘nalishlarini AI orqali aniqlash."
              />
            )}

            {activePage === "tournaments" && (
              <SimplePage
                icon="🏆"
                title="Turnirlar"
                description="Turnirlarga tayyorgarlik, natijalar, reyting va turnir yangiliklari."
              />
            )}

            {activePage === "news" && (
              <SimplePage
                icon="📰"
                title="Yangiliklar"
                description="Turnirlar, natijalar, o‘yinchilar va shaxmat olamidagi muhim yangiliklar."
              />
            )}

            {activePage === "reports" && (
              <SimplePage
                icon="📈"
                title="Hisobotlar"
                description="Oylik davomat, to‘lovlar, o‘quvchi rivojlanishi va markaz faoliyati bo‘yicha hisobotlar."
              />
            )}

          </div>
        </main>
      </div>
    </div>
  );
}


/* =========================
   DASHBOARD
========================= */

function Dashboard({ stats, openPage }) {
  return (
    <div className="space-y-6">

      {/* HERO */}
      <section className="relative overflow-hidden rounded-3xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 via-[#0d1b2e] to-[#081425] p-6 md:p-8">

        <div className="absolute -right-20 -top-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl"></div>

        <div className="relative">

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
            CHESARA tizimi faol
          </div>

          <h1 className="text-3xl md:text-5xl font-black mt-4 leading-tight">
            Shaxmat markazingizni
            <span className="text-emerald-400"> aqlli boshqaring.</span>
          </h1>

          <p className="text-slate-400 mt-4 max-w-2xl leading-relaxed">
            O‘quvchilar, guruhlar, davomat, darslar, o‘yinlar,
            AI tahlil, turnirlar va hisobotlar — barchasi
            yagona tizimda.
          </p>

          <div className="flex flex-wrap gap-3 mt-6">

            <button
              onClick={() => openPage("lessons")}
              className="px-5 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-white font-bold text-sm"
            >
              ♟️ Darsni boshlash
            </button>

            <button
              onClick={() => openPage("analysis")}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm"
            >
              🧠 AI tahlil
            </button>

            <button
              onClick={() => openPage("attendance")}
              className="px-5 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 font-bold text-sm"
            >
              ✅ Davomat
            </button>

          </div>
        </div>
      </section>


      {/* STATS */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-4">

        {stats.map((stat) => (
          <div
            key={stat.title}
            className="rounded-2xl bg-[#0b182a] border border-white/10 p-5 hover:border-emerald-500/30 transition-all"
          >

            <div className="flex justify-between items-start">

              <div>
                <div className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                  {stat.title}
                </div>

                <div className="text-3xl font-black mt-2">
                  {stat.value}
                </div>

                <div className="text-xs text-slate-500 mt-1">
                  {stat.text}
                </div>
              </div>

              <div className="w-11 h-11 rounded-xl bg-emerald-500/10 flex items-center justify-center text-xl">
                {stat.icon}
              </div>

            </div>
          </div>
        ))}

      </section>


      {/* QUICK ACTIONS */}
      <section>

        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-black">
              Tezkor boshqaruv
            </h2>

            <p className="text-xs text-slate-500 mt-1">
              Eng ko‘p ishlatiladigan funksiyalar
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">

          <ActionCard
            icon="🎓"
            title="O‘quvchi qo‘shish"
            description="Yangi o‘quvchini tizimga kiriting"
            onClick={() => openPage("students")}
          />

          <ActionCard
            icon="👥"
            title="Guruh yaratish"
            description="Yangi o‘quv guruhini tashkil qiling"
            onClick={() => openPage("groups")}
          />

          <ActionCard
            icon="♟️"
            title="Jonli dars"
            description="O‘quvchilar bilan dars o‘tkazing"
            onClick={() => openPage("lessons")}
          />

          <ActionCard
            icon="🧠"
            title="O‘yin tahlili"
            description="O‘yinlarni AI orqali tahlil qiling"
            onClick={() => openPage("analysis")}
          />

        </div>
      </section>


      {/* AUTOMATION */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        <InfoCard
          icon="⏰"
          title="Davomat nazorati"
          text="Ustoz dars boshlanganidan 15 daqiqa ichida davomat qilmasa, tizim direktor uchun ogohlantirish tayyorlaydi."
        />

        <InfoCard
          icon="📊"
          title="Oylik hisobot"
          text="O‘quvchining oy davomida qatnashuvi, darslari va natijalari bo‘yicha avtomatik hisobot shakllanadi."
        />

        <InfoCard
          icon="🤖"
          title="AI murabbiy"
          text="Kelajakda har bir o‘quvchi uchun individual AI murabbiy va shaxsiy rivojlanish yo‘li yaratiladi."
        />

      </section>

    </div>
  );
}


/* =========================
   ACTION CARD
========================= */

function ActionCard({ icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl bg-[#0b182a] border border-white/10 p-5 hover:border-emerald-500/40 hover:-translate-y-0.5 transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-2xl mb-4">
        {icon}
      </div>

      <div className="font-black">
        {title}
      </div>

      <div className="text-xs text-slate-500 mt-2 leading-relaxed">
        {description}
      </div>

      <div className="text-xs text-emerald-400 font-bold mt-4">
        Ochish →
      </div>
    </button>
  );
}


/* =========================
   INFO CARD
========================= */

function InfoCard({ icon, title, text }) {
  return (
    <div className="rounded-2xl bg-[#0b182a] border border-white/10 p-5">

      <div className="w-11 h-11 rounded-xl bg-white/5 flex items-center justify-center text-xl mb-4">
        {icon}
      </div>

      <div className="font-black">
        {title}
      </div>

      <p className="text-xs text-slate-500 mt-2 leading-relaxed">
        {text}
      </p>

    </div>
  );
}


/* =========================
   SIMPLE PAGE
========================= */

function SimplePage({ icon, title, description }) {
  return (
    <div className="space-y-6">

      <div>
        <div className="text-4xl mb-3">
          {icon}
        </div>

        <h1 className="text-3xl md:text-4xl font-black">
          {title}
        </h1>

        <p className="text-slate-400 mt-2 max-w-2xl">
          {description}
        </p>
      </div>

      <div className="rounded-3xl border border-dashed border-white/10 bg-[#0b182a] p-10 md:p-16 text-center">

        <div className="text-5xl mb-4">
          🚧
        </div>

        <h2 className="text-xl font-black">
          Bu modul keyingi bosqichda quriladi
        </h2>

        <p className="text-sm text-slate-500 max-w-xl mx-auto mt-3">
          Bu joyni shunchaki bo‘sh qoldirmaymiz.
          Keyingi bosqichda real ma’lumotlar bazasi,
          API va AI funksiyalari bilan ulaymiz.
        </p>

      </div>
    </div>
  );
}


const root = ReactDOM.createRoot(
  document.getElementById("root")
);

root.render(<App />);
