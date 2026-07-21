import React, { useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Bot,
  Brain,
  Building2,
  ChevronLeft,
  ClipboardCheck,
  GraduationCap,
  LayoutDashboard,
  Menu,
  MessageSquareText,
  Play,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Sparkles,
  UserRound,
  UsersRound
} from 'lucide-react';
import {
  adminSettings,
  agents,
  filterHotels,
  getAgentReadiness,
  getSectionById,
  hotelKnowledgeBase,
  menuSections,
  testQuestions,
  trainingTasks
} from './appData.js';
import { createInitialMessages, evaluateAgentReply, getNextClientReply, getScenarioById, scenarios } from './simulatorEngine.js';
import './styles.css';

const iconMap = {
  dashboard: <LayoutDashboard size={19} />,
  trainer: <Bot size={19} />,
  hotels: <Building2 size={19} />,
  tests: <ClipboardCheck size={19} />,
  agents: <UsersRound size={19} />,
  admin: <Settings size={19} />
};

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState('trainer');
  const [activeScenarioId, setActiveScenarioId] = useState('turkey-family-hard');
  const [messages, setMessages] = useState(() => createInitialMessages('turkey-family-hard'));
  const [draft, setDraft] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [mode, setMode] = useState('agent');
  const [hotelQuery, setHotelQuery] = useState('');

  const activeSection = useMemo(() => getSectionById(activeSectionId), [activeSectionId]);
  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);
  const readiness = useMemo(() => getAgentReadiness(trainingTasks), []);
  const filteredHotels = useMemo(() => filterHotels(hotelQuery), [hotelQuery]);

  const selectScenario = (id) => {
    setActiveScenarioId(id);
    setMessages(createInitialMessages(id));
    setDraft('');
    setLastEvaluation(null);
    setActiveSectionId('trainer');
  };

  const sendReply = () => {
    const text = draft.trim();
    if (!text) return;

    const evaluation = evaluateAgentReply(text);
    const nextReply = getNextClientReply(activeScenarioId, text, messages.filter((m) => m.role === 'agent').length + 1, messages);
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
          {menuSections.map((section) => (
            <NavItem
              key={section.id}
              icon={iconMap[section.id]}
              label={section.title}
              active={activeSectionId === section.id}
              open={sidebarOpen}
              onClick={() => setActiveSectionId(section.id)}
            />
          ))}
        </nav>

        <div className="accountCard">
          <div className="avatar">ДА</div>
          {sidebarOpen && <div><b>Демо-аккаунт</b><span>руководитель</span></div>}
        </div>
      </aside>

      <main className="mainArea">
        <header className="topbar">
          <div>
            <p className="eyebrow">{activeSection.eyebrow}</p>
            <h1>{activeSection.headline}</h1>
          </div>
          <div className="modeSwitch" role="tablist" aria-label="Режим">
            <button className={mode === 'agent' ? 'active' : ''} onClick={() => setMode('agent')}><UserRound size={16} /> Агент</button>
            <button className={mode === 'admin' ? 'active' : ''} onClick={() => setMode('admin')}><ShieldCheck size={16} /> Руководитель</button>
          </div>
        </header>

        <section className="heroStrip">
          <div>
            <span className="pill"><Brain size={15} /> MVP v0.2 · меню работает</span>
            <h2>{activeSection.title}</h2>
            <p>{activeSection.description}</p>
          </div>
          <div className="heroMetric"><b>{activeSectionId === 'trainer' ? (lastEvaluation?.score ?? 0) : readiness.percent}</b><span>{activeSectionId === 'trainer' ? 'текущий балл' : 'готовность'}</span></div>
        </section>

        {activeSectionId === 'dashboard' && <DashboardPage readiness={readiness} onOpenTrainer={() => setActiveSectionId('trainer')} />}
        {activeSectionId === 'trainer' && (
          <TrainerPage
            activeScenario={activeScenario}
            activeScenarioId={activeScenarioId}
            messages={messages}
            draft={draft}
            lastEvaluation={lastEvaluation}
            onDraftChange={setDraft}
            onQuickInsert={quickInsert}
            onSelectScenario={selectScenario}
            onSendReply={sendReply}
          />
        )}
        {activeSectionId === 'hotels' && <HotelsPage query={hotelQuery} onQueryChange={setHotelQuery} hotels={filteredHotels} />}
        {activeSectionId === 'tests' && <TestsPage />}
        {activeSectionId === 'agents' && <AgentsPage />}
        {activeSectionId === 'admin' && <AdminPage />}
      </main>
    </div>
  );
}

function DashboardPage({ readiness, onOpenTrainer }) {
  return (
    <section className="contentGrid twoColumns">
      <div className="panel dashboardPanel">
        <div className="panelHead"><div><p className="eyebrow">Сводка</p><h3>Испытательный срок: 10 дней</h3></div><span className="counter">{readiness.percent}%</span></div>
        <div className="statGrid">
          <Metric label="Тренировок пройдено" value={`${readiness.completed}/${readiness.total}`} />
          <Metric label="Средний балл" value="76" />
          <Metric label="Риск по группе" value="средний" />
          <Metric label="Готовы к клиентам" value="1 из 3" />
        </div>
        <button className="primaryAction" onClick={onOpenTrainer}><Bot size={18} /> Открыть тренажёр</button>
      </div>

      <div className="panel dashboardPanel">
        <div className="panelHead"><div><p className="eyebrow">Очередь заданий</p><h3>Что делать дальше</h3></div></div>
        <TaskList />
      </div>
    </section>
  );
}

function TrainerPage({ activeScenario, activeScenarioId, messages, draft, lastEvaluation, onDraftChange, onQuickInsert, onSelectScenario, onSendReply }) {
  return (
    <section className="workspaceGrid">
      <div className="panel scenarioPanel">
        <div className="panelHead"><div><p className="eyebrow">Сценарии</p><h3>Выбери тренировку</h3></div><span className="counter">{scenarios.length}</span></div>
        <div className="scenarioList">
          {scenarios.map((scenario) => (
            <button key={scenario.id} className={`scenarioCard ${scenario.id === activeScenarioId ? 'active' : ''}`} onClick={() => onSelectScenario(scenario.id)}>
              <span>{scenario.level}</span>
              <b>{scenario.title}</b>
              <small>{scenario.direction} · {scenario.duration}</small>
            </button>
          ))}
        </div>
        <div className="adminBox"><p className="eyebrow">Первая итерация админки</p><div className="adminRows"><span>Программа: испытательный срок 10 дней</span><span>Агент: новый менеджер</span><span>Статус: тренировка не сдана</span></div></div>
      </div>

      <div className="panel chatPanel">
        <div className="chatHeader"><div><p className="eyebrow">Активный диалог</p><h3>{activeScenario.title}</h3></div><button className="ghostButton" onClick={() => onSelectScenario(activeScenarioId)}><Play size={15} /> Перезапустить</button></div>
        <div className="briefCard"><div><b>Клиент:</b> {activeScenario.clientProfile.name}, {activeScenario.clientProfile.family}</div><div><b>Скрытая боль:</b> {activeScenario.clientProfile.hiddenNeed}</div><div><b>Триггер:</b> {activeScenario.clientProfile.trigger}</div></div>
        <div className="messagesArea">
          {messages.map((message) => (
            <div key={message.id} className={`messageRow ${message.role}`}><div className="bubble"><span>{message.role === 'client' ? 'Нейроклиент' : 'Агент'}</span><p>{message.text}</p><small>{message.time}</small></div></div>
          ))}
        </div>
        <div className="quickBar">
          <button onClick={() => onQuickInsert('Уточню возраст детей, бюджет, даты, пляж, питание и что для вас критично, а где готовы к компромиссу.')}>+ Уточнить потребности</button>
          <button onClick={() => onQuickInsert('Сразу честно предупрежу по рискам и проверю отзывы по свежим датам, чтобы не обещать лишнего.')}>+ Риски</button>
          <button onClick={() => onQuickInsert('Предложу 2–3 варианта: в бюджет, комфортнее и самый безопасный для семьи.')}>+ Вилка отелей</button>
        </div>
        <div className="composer">
          <textarea value={draft} onChange={(event) => onDraftChange(event.target.value)} placeholder="Напиши ответ клиенту. Система оценит: вопросы, честность, возражения, следующий шаг." onKeyDown={(event) => { if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') onSendReply(); }} />
          <button onClick={onSendReply}><Send size={18} /> Ответить</button>
        </div>
      </div>

      <aside className="sideStack">
        <div className="panel scorePanel">
          <div className="panelHead"><div><p className="eyebrow">Оценка ответа</p><h3>{lastEvaluation ? lastEvaluation.verdict : 'Ждём первый ответ'}</h3></div><div className={`scoreBadge ${(lastEvaluation?.score ?? 0) >= 78 ? 'good' : (lastEvaluation?.score ?? 0) >= 52 ? 'mid' : ''}`}>{lastEvaluation?.score ?? '—'}</div></div>
          <div className="rubricList">
            {(lastEvaluation?.details ?? []).map((item) => <div key={item.key} className="rubricItem"><span>{item.label}</span><b>{item.earned}/{item.max}</b></div>)}
            {!lastEvaluation && <p className="muted">После ответа здесь появится разбор: что агент сделал хорошо и что упустил.</p>}
          </div>
          {lastEvaluation && <div className="adviceBox">{lastEvaluation.advice.map((item) => <p key={item}>• {item}</p>)}</div>}
        </div>
        <div className="panel hotelsPanel"><div className="panelHead"><div><p className="eyebrow">База отелей в контексте</p><h3>Что можно использовать</h3></div><MessageSquareText size={18} /></div><HotelCards hotels={activeScenario.hotelContext} compact /></div>
        <div className="panel objectivesPanel"><div className="panelHead"><div><p className="eyebrow">Цели тренировки</p><h3>Что должен сделать агент</h3></div><GraduationCap size={18} /></div><ul>{activeScenario.objectives.map((objective) => <li key={objective}>{objective}</li>)}</ul></div>
      </aside>
    </section>
  );
}

function HotelsPage({ query, onQueryChange, hotels }) {
  return (
    <section className="contentGrid">
      <div className="panel pagePanel">
        <div className="panelHead"><div><p className="eyebrow">Поиск по базе</p><h3>{hotels.length} из {hotelKnowledgeBase.length} отелей</h3></div><Search size={19} /></div>
        <div className="searchBox"><Search size={18} /><input value={query} onChange={(event) => onQueryChange(event.target.value)} placeholder="Например: дети риск высокая / Египет риф / Дубай депозит" /></div>
        <HotelCards hotels={hotels} />
      </div>
    </section>
  );
}

function TestsPage() {
  return (
    <section className="contentGrid twoColumns">
      <div className="panel pagePanel"><div className="panelHead"><div><p className="eyebrow">Быстрый тест</p><h3>3 вопроса на опасные ошибки</h3></div><ClipboardCheck size={19} /></div><div className="qaList">{testQuestions.map((item, index) => <article key={item.question}><b>{index + 1}. {item.question}</b><p>{item.answer}</p></article>)}</div></div>
      <div className="panel pagePanel"><div className="panelHead"><div><p className="eyebrow">Прогресс программы</p><h3>Задания стажёра</h3></div></div><TaskList /></div>
    </section>
  );
}

function AgentsPage() {
  return (
    <section className="contentGrid">
      <div className="panel pagePanel"><div className="panelHead"><div><p className="eyebrow">Команда</p><h3>Стажёры на испытательном сроке</h3></div><UsersRound size={19} /></div><div className="agentTable">{agents.map((agent) => <article key={agent.name}><div><b>{agent.name}</b><span>{agent.role} · следующий шаг: {agent.next}</span></div><strong>{agent.readiness}%</strong><em className={`risk ${agent.risk}`}>{agent.risk} риск</em></article>)}</div></div>
    </section>
  );
}

function AdminPage() {
  return (
    <section className="contentGrid twoColumns">
      <div className="panel pagePanel"><div className="panelHead"><div><p className="eyebrow">Настройки</p><h3>Правила демо-программы</h3></div><Settings size={19} /></div><div className="settingsList">{adminSettings.map(([label, value]) => <div key={label}><span>{label}</span><b>{value}</b></div>)}</div></div>
      <div className="panel pagePanel accentPanel"><p className="eyebrow">Важно для продукта</p><h3>Следующий слой админки</h3><p>После этой итерации нужно добавить создание сценария: тип клиента, направление, отели в контексте, критерии оценки и финальный проходной балл.</p></div>
    </section>
  );
}

function TaskList() {
  return <div className="taskList">{trainingTasks.map((task) => <article key={task.id} className={task.status}><div><b>{task.title}</b><span>{task.type}</span></div><strong>{task.score ? `${task.score}/100` : task.status === 'in_progress' ? 'в работе' : 'закрыто'}</strong></article>)}</div>;
}

function HotelCards({ hotels, compact = false }) {
  return <div className="hotelList">{hotels.map((hotel) => <article key={hotel.name}><b>{hotel.name}</b><p><span>Кому подходит:</span> {hotel.fit}</p>{!compact && <p><span>Кому не продавать:</span> {hotel.notFor}</p>}<p><span>Риск:</span> {hotel.risk}</p><small>{hotel.source} · проверено: {hotel.checkedAt ?? 'демо'} · уверенность: {hotel.confidence}</small></article>)}</div>;
}

function Metric({ label, value }) {
  return <div className="metric"><span>{label}</span><b>{value}</b></div>;
}

function NavItem({ icon, label, active, open, onClick }) {
  return <button type="button" className={`navItem ${active ? 'active' : ''}`} onClick={onClick} title={label}>{icon}{open && <span>{label}</span>}</button>;
}

createRoot(document.getElementById('root')).render(<App />);
