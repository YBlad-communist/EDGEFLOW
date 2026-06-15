import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext.jsx";

export default function Tour() {
  const { user } = useAuth();
  const [step, setStep] = useState(-1);

  useEffect(() => {
    if (user && !localStorage.getItem("tour_done")) {
      const timer = setTimeout(() => setStep(0), 1500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const steps = [
    { title: "Добро пожаловать в EdgeFlow!", desc: "Платформа для обучения и преподавания." },
    { title: "Курсы и трансляции", desc: "Просматривайте курсы, покупайте доступ и учитесь." },
    { title: "Для учителей", desc: "Создавайте курсы и проводите живые трансляции." },
  ];

  const close = () => { localStorage.setItem("tour_done", "1"); setStep(-1); };

  if (step < 0 || step >= steps.length) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">
      <div className="bg-card border border-edge rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl">
        <div className="text-accent text-3xl font-extrabold mb-2 text-center">EdgeFlow</div>
        <h3 className="text-lg font-bold text-center mb-1">{steps[step].title}</h3>
        <p className="text-sm text-secondary text-center mb-6">{steps[step].desc}</p>
        <div className="flex items-center justify-between">
          <button onClick={close} className="text-xs text-secondary hover:text-white transition">Пропустить</button>
          <div className="flex gap-1">
            {steps.map((_, i) => (
              <div key={i} className={`w-2 h-2 rounded-full ${i === step ? "bg-accent" : "bg-border"}`} />
            ))}
          </div>
          <button
            onClick={() => step < steps.length - 1 ? setStep(step + 1) : close()}
            className="bg-accent text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-accent-hover transition"
          >
            {step < steps.length - 1 ? "Далее" : "Готово!"}
          </button>
        </div>
      </div>
    </div>
  );
}
