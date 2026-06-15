import { useState } from 'react';
import Joyride, { STATUS } from 'react-joyride';

const STUDENT_STEPS = [
  {
    target: 'body',
    content: 'Добро пожаловать в EdgeFlow — биржу живых знаний! Давайте покажем, как всё устроено.',
    placement: 'center',
  },
  {
    target: 'nav',
    content: 'Здесь навигация платформы. Все трансляции доступны на главной.',
  },
  {
    target: '[data-tour="broadcasts-list"]',
    content: 'Это список доступных трансляций. Кликните на любую, чтобы посмотреть детали.',
  },
];

const TEACHER_STEPS = [
  {
    target: 'body',
    content: 'Вы зарегистрированы как учитель! Сначала заполните анкету, чтобы начать вести трансляции.',
    placement: 'center',
  },
  {
    target: '[data-tour="teacher-profile-link"]',
    content: 'Нажмите здесь, чтобы заполнить анкету учителя.',
  },
  {
    target: '[data-tour="create-broadcast"]',
    content: 'После заполнения анкеты здесь появится кнопка создания трансляции.',
  },
];

export default function Tour({ role }) {
  const storageKey = `edgeflow_tour_done_${role}`;
  const [run, setRun] = useState(() => !localStorage.getItem(storageKey));

  const steps = role === 'teacher' ? TEACHER_STEPS : STUDENT_STEPS;

  const handleCallback = ({ status }) => {
    if ([STATUS.FINISHED, STATUS.SKIPPED].includes(status)) {
      localStorage.setItem(storageKey, '1');
      setRun(false);
    }
  };

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      showSkipButton
      callback={handleCallback}
      styles={{
        options: {
          backgroundColor: '#1f2937',
          textColor: '#f9fafb',
          primaryColor: '#6366f1',
          zIndex: 10000,
        },
      }}
      locale={{
        back: 'Назад',
        close: 'Закрыть',
        last: 'Готово',
        next: 'Далее',
        skip: 'Пропустить',
      }}
    />
  );
}
