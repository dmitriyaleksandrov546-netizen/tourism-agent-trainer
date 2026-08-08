import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { corpusInsights, createInitialMessages, evaluateAgentReply, getScenarioById, scenarios } from './simulatorEngine.js';
import { requestNeuroclientReply } from './neuroclientApi.js';
import './styles.css';

function App() {
  const [activeScenarioId, setActiveScenarioId] = useState('turkey-family-hard');
  const [messages, setMessages] = useState(() => createInitialMessages('turkey-family-hard'));
  const [draft, setDraft] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [isSending, setIsSending] = useState(false);

  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);
  const clientMessage = messages.find((message) => message.role === 'client')?.text || activeScenario.startMessage;
  const lastClientReply = messages.filter((message) => message.role === 'client').at(-1)?.text;

  const selectScenario = (id) => {
    setActiveScenarioId(id);
    setMessages(createInitialMessages(id));
    setDraft('');
    setLastEvaluation(null);
    setIsSending(false);
  };

  const resetAttempt = () => {
    setMessages(createInitialMessages(activeScenarioId));
    setDraft('');
    setLastEvaluation(null);
    setIsSending(false);
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
          <h2>1. Выберите ситуацию</h2>
          <div className="situationList">
            {scenarios.map((scenario) => (
              <button key={scenario.id} className={scenario.id === activeScenarioId ? 'active' : ''} onClick={() => selectScenario(scenario.id)}>
                <b>{scenario.shortTitle}</b>
                <span>{scenario.shortSubtitle}</span>
              </button>
            ))}
          </div>
          <CorpusPanel />
        </section>

        <section className="card trainer">
          <div className="sectionHead">
            <h2>2. Ответьте клиенту</h2>
            <button className="ghost" onClick={resetAttempt}>Очистить</button>
          </div>

          <p className="label">Клиент пишет:</p>
          <article className="clientText">{clientMessage}</article>

          <label className="answerBox">
            <span>Напишите ответ как в WhatsApp.</span>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              placeholder="Например: понимаю задачу, уточню детали, честно скажу про риски и предложу следующий шаг."
              onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') sendReply();
              }}
            />
          </label>

          <button className="primary" onClick={sendReply} disabled={isSending}>{isSending ? 'Клиент думает...' : 'Проверить'}</button>

          {lastEvaluation && <ClientPushback text={lastClientReply} />}
          {lastEvaluation && <Review evaluation={lastEvaluation} scenario={activeScenario} />}
        </section>
      </section>
    </main>
  );
}

function CorpusPanel() {
  const coverage = corpusInsights.sourceCoverage || {};
  const topTriggers = corpusInsights.silenceTriggers?.slice(0, 2) || [];

  return (
    <section className="corpusPanel" aria-label="Источник методики">
      <p className="corpusTitle">Методика основана на корпусе</p>
      <div className="corpusStats">
        <span><b>{corpusInsights.totalCalls}</b> звонков</span>
        <span><b>{coverage.wazzupDealFiles || corpusInsights.wazzupDialogs}</b> Wazzup</span>
        <span><b>{coverage.trainingMaterials || corpusInsights.trainingMaterials.total}</b> материалов</span>
      </div>
      <p className="corpusNote">Средний балл реальных звонков: {corpusInsights.averageScore}/100. Тренажёр проверяет не “красивые слова”, а действия, которые снижают риск потери клиента.</p>
      <div className="corpusTriggers">
        {topTriggers.map((trigger) => (
          <p key={trigger.label}>⚠ {trigger.label} — {trigger.share}%</p>
        ))}
      </div>
    </section>
  );
}

function ClientPushback({ text }) {
  if (!text) return null;
  return (
    <section className="clientPushback">
      <p className="label">Клиент после вашего ответа:</p>
      <article>{text}</article>
    </section>
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
