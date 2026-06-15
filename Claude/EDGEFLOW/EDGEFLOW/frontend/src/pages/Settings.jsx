import { useAuth } from "../contexts/AuthContext.jsx";

export default function Settings() {
  const { user, updateMode } = useAuth();
  if (!user) return null;

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Настройки</h1>
      <div className="bg-card border border-edge rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold mb-1">Email</h3>
        <p className="text-sm text-secondary">{user.email}</p>
      </div>
      <div className="bg-card border border-edge rounded-xl p-5 mb-4">
        <h3 className="text-sm font-bold mb-1">Роль</h3>
        <p className="text-sm text-secondary">{user.role === "teacher" ? "Учитель" : "Ученик"}</p>
      </div>
      {user.role === "teacher" && (
        <div className="bg-card border border-edge rounded-xl p-5">
          <h3 className="text-sm font-bold mb-2">Режим</h3>
          <p className="text-xs text-secondary mb-3">Выберите, хотите ли вы только учиться или также преподавать</p>
          <div className="flex gap-3">
            {["learn_only", "learn_and_teach"].map((m) => (
              <label key={m} className={`flex-1 flex flex-col gap-1 p-3 border-2 rounded-lg cursor-pointer transition ${user.mode === m ? "border-accent bg-accent/10" : "border-edge"}`}>
                <input type="radio" name="mode" value={m} checked={user.mode === m} onChange={() => updateMode(m)} className="hidden" />
                <span className="font-bold text-sm">{m === "learn_only" ? "Только обучение" : "Обучение и преподавание"}</span>
                <span className="text-xs text-secondary">{m === "learn_only" ? "Скрыть пункты учителя" : "Показать все пункты"}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
