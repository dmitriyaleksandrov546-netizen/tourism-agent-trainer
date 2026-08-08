import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createInitialMessages, evaluateAgentReply, getScenarioById, scenarios } from './simulatorEngine.js';
import { requestNeuroclientReply } from './neuroclientApi.js';
import './styles.css';

function App() {
  const [activeScenarioId, setActiveScenarioId] = useState('turkey-family-hard');
  const [messages, setMessages] = useState(() => createInitialMessages('turkey-family-hard'));
  const [draft, setDraft] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [isSending, setIsSending] = useState(false);
  const [copyState, setCopyState] = useState('');

  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);

  const selectScenario = (id) => {
    setActiveScenarioId(id);
    setMessages(createInitialMessages(id, Date.now()));
    setDraft('');
    setLastEvaluation(null);
    setIsSending(false);
    setCopyState('');
  };

  const resetAttempt = () => {
    setMessages(createInitialMessages(activeScenarioId, Date.now()));
    setDraft('');
    setLastEvaluation(null);
    setIsSending(false);
    setCopyState('');
  };

  const copyDialogue = async () => {
    const lines = [
      `Сценарий: ${activeScenario.shortTitle} — ${activeScenario.shortSubtitle}`,
      `Уровень: ${activeScenario.level}`,
      '',
      ...messages.map((message) => `${message.role === 'client' ? 'Клиент' : 'Агент'}: ${message.text}`),
      ...(draft.trim() ? ['', `Черновик агента: ${draft.trim()}`] : []),
      ...(lastEvaluation ? ['', `Последний балл: ${lastEvaluation.score}/100`, `Вердикт: ${lastEvaluation.verdict}`] : [])
    ];

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopyState('Скопировано');
    } catch (_error) {
      setCopyState('Не удалось скопировать');
    }
  };

  const sendReply = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    const evaluation = evaluateAgentReply(text, activeScenario);
    const turn = messages.filter((m) => m.role === 'agent').length + 1;
    const thinkingId = `client-thinking-${Date.now()}`;
    const nextMessages = [
      ...messages,
      { id: `agent-${messages.length}`, role: 'agent', text, time: 'ваш ответ' },
      { id: thinkingId, role: 'client', text: '...', time: 'клиент думает' }
    ];

    setMessages(nextMessages);
    setLastEvaluation(evaluation);
    setDraft('');
    setIsSending(true);

    const reply = await requestNeuroclientReply({ scenarioId: activeScenarioId, agentText: text, turn, history: messages });
    setMessages((current) => current.map((message) => (
      message.id === thinkingId
        ? { ...message, text: reply.text, time: reply.source === 'openai' ? 'AI-клиент' : 'ответ клиента' }
        : message
    )));
    setIsSending(false);
  };

  useEffect(() => {
    const handleGlobalEnter = (event) => {
      if (event.key !== 'Enter' || event.shiftKey || event.metaKey || event.ctrlKey || event.altKey) return;
      const tag = document.activeElement?.tagName?.toLowerCase();
      if (tag === 'textarea' || tag === 'input' || tag === 'button' || document.activeElement?.isContentEditable) return;
      if (!draft.trim() || isSending) return;
      event.preventDefault();
      sendReply();
    };

    window.addEventListener('keydown', handleGlobalEnter);
    return () => window.removeEventListener('keydown', handleGlobalEnter);
  }, [draft, isSending, activeScenarioId, messages]);

  return (
    <main className="app">
      <header className="top">
        <div>
          <p className="kicker">Тренажёр турагента</p>
          <h1>Ответьте клиенту. Получите короткий разбор.</h1>
        </div>
        {lastEvaluation && <button className="linkButton" onClick={resetAttempt}>Новый ответ</button>}
      </header>

      <section className="layout">
        <section className="card situations">
          <nav className="sideMenu" aria-label="Меню платформы">
            <button className="active" type="button">Тренажёр</button>
            <button type="button" disabled>База отелей</button>
            <button type="button" disabled>Тесты</button>
            <button type="button" disabled>Стажёры</button>
            <button type="button" disabled>Настройки</button>
          </nav>

          <h2>Ситуации</h2>
          <div className="situationList">
            {scenarios.map((scenario, index) => (
              <button key={scenario.id} className={scenario.id === activeScenarioId ? 'active' : ''} onClick={() => selectScenario(scenario.id)}>
                <small>Уровень {index + 1} · {scenario.level}</small>
                <b>{scenario.shortTitle}</b>
                <span>{scenario.shortSubtitle}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="card trainer">
          <div className="sectionHead">
            <h2>2. Ответьте клиенту</h2>
            <div className="headActions">
              <button className="ghost" onClick={copyDialogue}>Скопировать диалог</button>
              <button className="ghost" onClick={resetAttempt}>Очистить</button>
            </div>
          </div>
          {copyState && <p className="copyState">{copyState}</p>}

          <div className="dialogWindow" aria-label="Диалог с клиентом">
            {messages.map((message) => (
              <article key={message.id} className={`dialogMessage ${message.role}`}>
                <span>{message.role === 'client' ? 'Клиент' : 'Вы'}</span>
                <p>{message.text}</p>
                <small>{message.time}</small>
              </article>
            ))}
          </div>

          <label className="answerBox">
            <span>Напишите ответ как в WhatsApp.</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Напишите как клиенту в WhatsApp. Enter — отправить, Shift+Enter — новая строка."
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  sendReply();
                }
              }}
            />
          </label>

          <button className="primary" onClick={sendReply} disabled={isSending}>{isSending ? 'Клиент думает...' : 'Проверить'}</button>

          {lastEvaluation && <Review evaluation={lastEvaluation} scenario={activeScenario} />}
        </section>
      </section>
    </main>
  );
}

function Review({ evaluation, scenario }) {
  const good = evaluation.dimensions.filter((item) => item.status === 'good').slice(0, 3);
  const fixes = evaluation.topFixes.slice(0, 3);
  const example = buildBetterExample(evaluation, scenario);
  const label = evaluation.score >= 80 ? 'Хорошо' : evaluation.score >= 55 ? 'Нужно доработать' : 'Клиент может пропасть';

  return (
    <section className={`review ${evaluation.score >= 80 ? 'good' : evaluation.score >= 55 ? 'mid' : 'bad'}`}>
      <div className="reviewTop">
        <h2>Разбор ответа</h2>
        <span>{evaluation.score} из 100</span>
      </div>
      <h3>Оценка: {label}</h3>

      {!!good.length && (
        <div className="reviewBlock">
          <b>Что хорошо:</b>
          {good.map((item) => <p key={item.key}>✓ {item.label}</p>)}
        </div>
      )}

      <div className="reviewBlock">
        <b>Что исправить:</b>
        {fixes.length ? fixes.map((item) => <p key={item}>✕ {item}</p>) : <p>✓ Критичных пробелов нет. Можно сделать ответ короче и конкретнее.</p>}
      </div>

      <div className="reviewBlock example">
        <b>Попробуйте так:</b>
        <p>{example}</p>
      </div>
    </section>
  );
}

function buildBetterExample(evaluation, scenario) {
  if (scenario.id === 'turkey-family-hard') {
    return 'Понимаю задачу. Чтобы не предложить неподходящий отель, уточню даты и что важнее: безопасный вход в море для младшего или аквапарк для старшего. В 180 тысяч будет компромисс, поэтому сегодня до 18:00 пришлю 3 варианта с плюсами, минусами и отзывами.';
  }
  if (scenario.id === 'egypt-budget-objections') {
    return 'Давайте сравним не только цену, а что входит: рейс, номер, пляж, риф и отзывы. Дешевле может быть с риском, нормальный риф — чуть дороже. Сегодня до 17:00 пришлю 3 варианта и покажу разницу.';
  }
  return 'Я не буду обещать без проверки. Сначала сверю стройку рядом, депозит, пляж и свежие отзывы по источникам. Сегодня до 18:00 пришлю 2–3 варианта с фактами, рисками и выводом, какой безопаснее именно для вас.';
}

createRoot(document.getElementById('root')).render(<App />);
