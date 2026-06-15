import { Link } from 'react-router-dom';

export default function PaymentSuccess() {
  return (
    <div className="min-h-[calc(100vh-56px)] flex items-center justify-center p-4">
      <div className="card text-center max-w-md w-full">
        <div className="text-5xl mb-4">✅</div>
        <h1 className="text-2xl font-bold mb-2">Оплата прошла успешно!</h1>
        <p className="text-gray-400 text-sm mb-6">
          Доступ к трансляции открыт. Вернитесь и смотрите.
        </p>
        <div className="flex gap-3 justify-center">
          <Link to="/" className="btn-secondary">
            На главную
          </Link>
          <Link to="/profile" className="btn-primary">
            Мои покупки
          </Link>
        </div>
      </div>
    </div>
  );
}
