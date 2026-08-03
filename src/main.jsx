import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ArrowRight, BarChart3, CheckCircle2, MessageCircle, RefreshCw, Send, ShieldAlert } from 'lucide-react';
import { corpusInsights, createInitialMessages, evaluateAgentReply, getNextClientReply, getScenarioById, scenarios } from './simulatorEngine.js';
import './styles.css';

function App() {
  const [activeScenarioId, setActiveScenarioId] = useState('turkey-family-hard');
  const [messages, setMessages] = useState(() => createInitialMessages('turkey-family-hard'));
  const [draft, setDraft] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);

  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);
  const corpusArchetype = corpusInsights.mainArchetypes.find((item) => item.id === activeScenario.archetype) || corpusInsights.mainArchetypes[0];

  const selectScenario = (id) => {
    setActiveScenarioId(id);
    setMessages(createInitialMessages(id));
    setDraft('');
    setLastEvaluation(null);
  };

  const sendReply = () => {
    const text = draft.trim();
    if (!text) return;

    const evaluation = evaluateAgentReply(text);
    const nextReply = getNextClientReply(activeScenarioId, text, messages.filter((m) => m.role === 'agent').length + 1);
    const now = new Date().toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

    setMessages((current) => [
      ...current,
      { id: `agent-${current.length}`, role: 'agent', text, time: now },
      { id: `client-${current.length + 1}`, role: 'client', text: nextReply, time: 'нейроклиент' }
    ]);
    setLastEvaluation(evaluation);
    setDraft('');
  };

  return (
    <main className="page">
      <section className="hero">
        <div>
          <p className="eyebrow">T‑Trainer · тренажёр турагента</p>
          <h1>Научись отвечать сложному клиенту так, чтобы он не пропал</h1>
          <p className="lead">Система проверяет не набор слов, а логику ответа: понял ли агент клиента, честно ли объяснил риски и зафиксировал ли следующий шаг.</p>
        </div>
        <div className="scoreHero">
          <span>балл</span>
          <b>{lastEvaluation?.score ?? '—'}</b>
          <small>{lastEvaluation?.verdict ?? 'ответ ещё не отправлен'}</small>
        </div>
      </section>

      <section className="simpleGrid">
        <aside className="panel scenarioPanel">
          <div className="panelTitle">
            <MessageCircle size={20} />
            <div>
              <p className="eyebrow">Шаг 1</p>
              <h2>Выбери клиента</h2>
            </div>
          </div>
          <div className="scenarioList">
            {scenarios.map((scenario) => (
              <button key={scenario.id} className={`scenarioCard ${scenario.id === activeScenarioId ? 'active' : ''}`} onClick={() => selectScenario(scenario.id)}>
                <b>{scenario.title}</b>
                <span>{scenario.level} · {scenario.direction}</span>
              </button>
            ))}
          </div>

          <div className="corpusMini">
            <BarChart3 size={18} />
            <div>
              <b>Основано на {corpusInsights.totalCalls} звонках</b>
              <p>{corpusArchetype.label}: {corpusArchetype.trigger}</p>
            </div>
          </div>
        </aside>

        <section className="panel trainerPanel">
          <div className="trainerHeader">
            <div>
              <p className="eyebrow">Шаг 2</p>
              <h2>{activeScenario.title}</h2>
            </div>
            <button className="secondary" onClick={() => selectScenario(activeScenarioId)}><RefreshCw size={16} /> Сначала</button>
          </div>

          <div className="clientNeed">
            <b>Что важно клиенту:</b>
            <span>{activeScenario.clientProfile.hiddenNeed}</span>
          </div>

          <div className="chat">
            {messages.map((message) => (
              <article key={message.id} className={`message ${message.role}`}>
                <span>{message.role === 'client' ? 'Клиент' : 'Агент'}</span>
                <p>{message.text}</p>
              </article>
            ))}
          </div>

          <div className="composer">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Напиши ответ клиенту: что понял, что уточнишь, какие риски, какие варианты и следующий шаг." onKeyDown={(event) => {
              if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') sendReply();
            }} />
            <button onClick={sendReply}>Проверить ответ <Send size={18} /></button>
          </div>
        </section>

        <aside className="panel resultPanel">
          <div className="panelTitle">
            <CheckCircle2 size={20} />
            <div>
              <p className="eyebrow">Шаг 3</p>
              <h2>Разбор</h2>
            </div>
          </div>

          {!lastEvaluation && <EmptyResult />}
          {lastEvaluation && <Result evaluation={lastEvaluation} />}
        </aside>
      </section>
    </main>
  );
}

function EmptyResult() {
  return (
    <div className="emptyResult">
      <ShieldAlert size={32} />
      <b>Ответ ещё не проверен</b>
      <p>После отправки здесь будет коротко: что хорошо, что слабо и почему клиент может пропасть.</p>
    </div>
  );
}

function Result({ evaluation }) {
  const visibleDetails = evaluation.details.filter((item) => item.earned > 0 || ['diagnosis', 'riskHonesty', 'contextReading', 'nextStep'].includes(item.key));
  return (
    <div className="resultStack">
      <div className={`scoreCard ${evaluation.score >= 78 ? 'good' : evaluation.score >= 52 ? 'mid' : 'bad'}`}>
        <b>{evaluation.score}</b>
        <span>{evaluation.verdict}</span>
      </div>

      <div className="checks">
        {visibleDetails.map((item) => (
          <div key={item.key}>
            <span>{item.label}</span>
            <b>{item.earned}/{item.max}</b>
          </div>
        ))}
      </div>

      <div className="advice">
        <h3>Что исправить</h3>
        {evaluation.advice.slice(0, 3).map((item) => <p key={item}><ArrowRight size={15} /> {item}</p>)}
      </div>

      {!!evaluation.corpusSignals.length && (
        <div className="corpusSignals">
          <h3>Сигналы из корпуса</h3>
          {evaluation.corpusSignals.slice(0, 2).map((item) => <p key={item}>{item}</p>)}
        </div>
      )}
    </div>
  );
}

createRoot(document.getElementById('root')).render(<App />);
