import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bot,
  Brain,
  Building2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Play,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound
} from 'lucide-react';
import { createInitialMessages, evaluateAgentReply, getNextClientReply, getScenarioById, scenarios } from './simulatorEngine.js';
import './styles.css';

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeScenarioId, setActiveScenarioId] = useState('turkey-family-hard');
  const [messages, setMessages] = useState(() => createInitialMessages('turkey-family-hard'));
  const [draft, setDraft] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [mode, setMode] = useState('agent');

  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);

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

  const quickInsert = (text) => {
    setDraft((current) => (current ? `${current}\n${text}` : text));
  };

  return (
    <div className="appShell">
      <aside className={`sidebar ${sidebarOpen ? 'expanded' : 'collapsed'}`}>
        <button className="sidebarToggle" onClick={() => setSidebarOpen((value) => !value)} aria-label="Открыть меню">
          {sidebarOpen ? <ChevronLeft size={18} /> : <Menu size={18} />}
        </button>

        <div className="brandBlock">
          <div className="brandIcon"><Sparkles size={20} /></div>
          {sidebarOpen && <div><b>Agent Bootcamp</b><span>адаптация турагентов</span></div>}
        </div>

        <nav className="navList">
          <NavItem icon={<LayoutDashboard size={19} />} label="Дашборд" active={false} open={sidebarOpen} />
          <NavItem icon={<Bot size={19} />} label="Тренажёр" active open={sidebarOpen} />
          <NavItem icon={<Building2 size={19} />} label="Отели" active={false} open={sidebarOpen} />
          <NavItem icon={<ClipboardCheck size={19} />} label="Тесты" active={false} open={sidebarOpen} />
          <NavItem icon={<UsersRound size={19} />} label="Агенты" active={false} open={sidebarOpen} />
          <NavItem icon={<Settings size={19} />} label="Админка" active={false} open={sidebarOpen} />
        </nav>

        <div className="accountCard">
          <div className="avatar">ДА</div>
          {sidebarOpen && <div><b>Демо-аккаунт</b><span>руководитель</span></div>}
        </div>
      </aside>

      <main className="mainArea">
        <header className="topbar">
          <div>
            <p className="eyebrow">Раздел / Тренажёр нейроклиента</p>
            <h1>Отработка сложных клиентов до выхода на реальные заявки</h1>
          </div>
          <div className="modeSwitch" role="tablist" aria-label="Режим">
            <button className={mode === 'agent' ? 'active' : ''} onClick={() => setMode('agent')}><UserRound size={16} /> Агент</button>
            <button className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}><ShieldCheck size={16} /> Руководитель</button>
          </div>
        </header>

        <section className="heroStrip">
          <div>
            <span className="pill"><Brain size={15} /> Neuroclient v0.1</span>
            <h2>{mode === 'admin' ? 'Видно, кто готов к клиентам, а кто сольёт заявку' : 'Тренируйся на самых неприятных запросах без риска потерять клиента'}</h2>
            <p>Сценарий строится вокруг семьи, бюджета, отеля, возражений и скрытых критериев. После каждого ответа — оценка по продажам и честности.</p>
          </div>
          <div className="heroMetric"><b>{lastEvaluation?.score ?? 0}</b><span>текущий балл</span></div>
        </section>

        <section className="workspaceGrid">
          <div className="panel scenarioPanel">
            <div className="panelHead">
              <div>
                <p className="eyebrow">Сценарии</p>
                <h3>Выбери тренировку</h3>
              </div>
              <span className="counter">{scenarios.length}</span>
            </div>
            <div className="scenarioList">
              {scenarios.map((scenario) => (
                <button key={scenario.id} className={`scenarioCard ${scenario.id === activeScenarioId ? 'active' : ''}`} onClick={() => selectScenario(scenario.id)}>
                  <span>{scenario.level}</span>
                  <b>{scenario.title}</b>
                  <small>{scenario.direction} · {scenario.duration}</small>
                </button>
              ))}
            </div>

            <div className="adminBox">
              <p className="eyebrow">Первая итерация админки</p>
              <div className="adminRows">
                <span>Программа: испытательный срок 10 дней</span>
                <span>Агент: новый менеджер</span>
                <span>Статус: тренировка не сдана</span>
              </div>
            </div>
          </div>

          <div className="panel chatPanel">
            <div className="chatHeader">
              <div>
                <p className="eyebrow">Активный диалог</p>
                <h3>{activeScenario.title}</h3>
              </div>
              <button className="ghostButton" onClick={() => selectScenario(activeScenarioId)}><Play size={15} /> Перезапустить</button>
            </div>

            <div className="briefCard">
              <div><b>Клиент:</b> {activeScenario.clientProfile.name}, {activeScenario.clientProfile.family}</div>
              <div><b>Скрытая боль:</b> {activeScenario.clientProfile.hiddenNeed}</div>
              <div><b>Триггер:</b> {activeScenario.clientProfile.trigger}</div>
            </div>

            <div className="messagesArea">
              {messages.map((message) => (
                <div key={message.id} className={`messageRow ${message.role}`}>
                  <div className="bubble">
                    <span>{message.role === 'client' ? 'Нейроклиент' : 'Агент'}</span>
                    <p>{message.text}</p>
                    <small>{message.time}</small>
                  </div>
                </div>
              ))}
            </div>

            <div className="quickBar">
              <button onClick={() => quickInsert('Уточню возраст детей, бюджет, даты, пляж, питание и что для вас критично, а где готовы к компромиссу.')}>+ Уточнить потребности</button>
              <button onClick={() => quickInsert('Сразу честно предупрежу по рискам и проверю отзывы по свежим датам, чтобы не обещать лишнего.')}>+ Риски</button>
              <button onClick={() => quickInsert('Предложу 2–3 варианта: в бюджет, комфортнее и самый безопасный для семьи.')}>+ Вилка отелей</button>
            </div>

            <div className="composer">
              <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Напиши ответ клиенту. Система оценит: вопросы, честность, возражения, следующий шаг." onKeyDown={(event) => {
                if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') sendReply();
              }} />
              <button onClick={sendReply}><Send size={18} /> Ответить</button>
            </div>
          </div>

          <aside className="sideStack">
            <div className="panel scorePanel">
              <div className="panelHead">
                <div>
                  <p className="eyebrow">Оценка ответа</p>
                  <h3>{lastEvaluation ? lastEvaluation.verdict : 'Ждём первый ответ'}</h3>
                </div>
                <div className={`scoreBadge ${(lastEvaluation?.score ?? 0) >= 78 ? 'good' : (lastEvaluation?.score ?? 0) >= 52 ? 'mid' : ''}`}>{lastEvaluation?.score ?? '—'}</div>
              </div>
              <div className="rubricList">
                {(lastEvaluation?.details ?? []).map((item) => (
                  <div key={item.key} className="rubricItem">
                    <span>{item.label}</span>
                    <b>{item.earned}/{item.max}</b>
                  </div>
                ))}
                {!lastEvaluation && <p className="muted">После ответа здесь появится разбор: что агент сделал хорошо и что упустил.</p>}
              </div>
              {lastEvaluation && <div className="adviceBox">{lastEvaluation.advice.map((item) => <p key={item}>• {item}</p>)}</div>}
            </div>

            <div className="panel hotelsPanel">
              <div className="panelHead">
                <div>
                  <p className="eyebrow">База отелей в контексте</p>
                  <h3>Что можно использовать</h3>
                </div>
                <MessageSquareText size={18} />
              </div>
              <div className="hotelList">
                {activeScenario.hotelContext.map((hotel) => (
                  <article key={hotel.name}>
                    <b>{hotel.name}</b>
                    <p><span>Кому подходит:</span> {hotel.fit}</p>
                    <p><span>Риск:</span> {hotel.risk}</p>
                    <small>{hotel.source} · уверенность: {hotel.confidence}</small>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel objectivesPanel">
              <div className="panelHead">
                <div>
                  <p className="eyebrow">Цели тренировки</p>
                  <h3>Что должен сделать агент</h3>
                </div>
                <GraduationCap size={18} />
              </div>
              <ul>
                {activeScenario.objectives.map((objective) => <li key={objective}>{objective}</li>)}
              </ul>
            </div>
          </aside>
        </section>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, open }) {
  return <button className={`navItem ${active ? 'active' : ''}`}>{icon}{open && <span>{label}</span>}</button>;
}

createRoot(document.getElementById('root')).render(<App />);
