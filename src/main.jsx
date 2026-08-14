import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createInitialMessages, evaluateAgentReply, getScenarioById, scenarios } from './simulatorEngine.js';
import { requestNeuroclientReply } from './neuroclientApi.js';
import { requestSelectionAnalysis } from './selectionAnalysisApi.js';
import { buildTravelDocumentChecklist } from './travelRequirements.js';
import {
  clearDialogHistory,
  createDialogRecord,
  formatDialogRecord,
  loadDialogHistory,
  removeDialogRecord,
  upsertDialogRecord
} from './dialogHistoryStore.js';
import { deleteServerDialogRecord, fetchServerDialogHistory, saveServerDialogRecord } from './dialogHistoryApi.js';
import './styles.css';

function App() {
  const [activeScenarioId, setActiveScenarioId] = useState('turkey-family-hard');
  const [messages, setMessages] = useState(() => createInitialMessages('turkey-family-hard'));
  const [draft, setDraft] = useState('');
  const [lastEvaluation, setLastEvaluation] = useState(null);
  const [activePhase, setActivePhase] = useState('dialogue');
  const [selectionAnalysis, setSelectionAnalysis] = useState(null);
  const [selectionInput, setSelectionInput] = useState('');
  const [isAnalyzingSelection, setIsAnalyzingSelection] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [dialogHistory, setDialogHistory] = useState(() => loadDialogHistory());
  const [historyMode, setHistoryMode] = useState('local');
  const [isTravelMemoOpen, setIsTravelMemoOpen] = useState(false);
  const [checkedTravelItems, setCheckedTravelItems] = useState({});

  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);
  const travelChecklist = useMemo(() => buildTravelDocumentChecklist(activeScenario), [activeScenario]);

  const selectScenario = (id) => {
    setActiveScenarioId(id);
    setMessages(createInitialMessages(id, Date.now()));
    setDraft('');
    setLastEvaluation(null);
    setSelectionAnalysis(null);
    setSelectionInput('');
    setActivePhase('dialogue');
    setIsSending(false);
    setCopyState('');
    setIsTravelMemoOpen(false);
    setCheckedTravelItems({});
  };

  const resetAttempt = () => {
    setMessages(createInitialMessages(activeScenarioId, Date.now()));
    setDraft('');
    setLastEvaluation(null);
    setSelectionAnalysis(null);
    setSelectionInput('');
    setActivePhase('dialogue');
    setIsSending(false);
    setCopyState('');
    setIsTravelMemoOpen(false);
    setCheckedTravelItems({});
  };

  const copyText = async (text, okText = 'Скопировано') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(okText);
    } catch (_error) {
      setCopyState('Не удалось скопировать');
    }
  };

  const copyDialogue = async () => {
    const record = createDialogRecord({ scenario: activeScenario, messages, evaluation: lastEvaluation });
    const text = formatDialogRecord({ ...record, messages: draft.trim() ? [...messages, { role: 'agent', text: draft.trim() }] : messages });
    await copyText(text);
  };

  const copyHistoryRecord = async (record) => copyText(formatDialogRecord(record), 'Диалог скопирован');

  const openHistoryRecord = (record) => {
    setActiveScenarioId(record.scenarioId);
    setMessages(record.messages || []);
    setDraft('');
    setLastEvaluation(record.score !== null ? { score: record.score, verdict: record.verdict, dimensions: [], topFixes: [] } : null);
    setCopyState('Диалог открыт из истории');
  };

  const deleteHistoryRecord = (id) => {
    setDialogHistory(removeDialogRecord(id));
    deleteServerDialogRecord(id).then((result) => {
      if (result.ok) fetchServerDialogHistory().then((history) => history.ok && setDialogHistory(history.records));
    });
  };

  const toggleTravelItem = (id) => {
    setCheckedTravelItems((current) => ({ ...current, [id]: !current[id] }));
  };

  const resetTravelChecklist = () => setCheckedTravelItems({});

  const clearHistory = () => {
    setDialogHistory(clearDialogHistory());
    setCopyState('История очищена');
  };

  const analyzeRealSelection = async () => {
    const input = selectionInput.trim();
    if (!input || isAnalyzingSelection) {
      setCopyState('Сначала вставьте ссылку или текст подборки. Без этого анализ будет имитацией.');
      return;
    }

    setIsAnalyzingSelection(true);
    setCopyState('Открываю и анализирую реальную подборку...');
    try {
      const result = await requestSelectionAnalysis({ scenarioId: activeScenarioId, selectionInput: input });
      const analysis = result.analysis;
      const selectionWasAccessible = !result.fetchError;
      const clientSelectionTime = selectionWasAccessible ? 'клиент изучил подборку' : 'клиент не смог открыть ссылку';
      const selectionStatusText = selectionWasAccessible
        ? 'Клиент изучил реальную подборку и вернулся с вопросами'
        : 'Ссылка не открылась полностью — клиент попросил доступный текст/скрин.';

      setSelectionAnalysis(analysis);
      setActivePhase('selection-review');
      setMessages((current) => [
        ...current,
        { id: `agent-selection-${Date.now()}`, role: 'agent', text: `Я отправил(а) подборку: ${input}`, time: 'подборка от менеджера' },
        { id: `client-selection-${Date.now()}`, role: 'client', text: analysis.clientReply, time: clientSelectionTime }
      ]);
      setLastEvaluation(null);
      setDraft('');
      setCopyState(selectionStatusText);
    } catch (error) {
      setCopyState(error?.message || 'Не удалось проанализировать подборку');
    } finally {
      setIsAnalyzingSelection(false);
    }
  };

  const sendReply = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    const evaluation = evaluateAgentReply(text, activeScenario, { phase: activePhase });
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

    const reply = await requestNeuroclientReply({ scenarioId: activeScenarioId, agentText: text, turn, history: messages, phase: activePhase, selectionAnalysis });
    const finalMessages = nextMessages.map((message) => (
      message.id === thinkingId
        ? { ...message, text: reply.text, time: reply.source === 'openai' ? 'AI-клиент' : 'ответ клиента' }
        : message
    ));
    setMessages(finalMessages);
    const record = createDialogRecord({ scenario: activeScenario, messages: finalMessages, evaluation });
    setDialogHistory(upsertDialogRecord(record));
    saveServerDialogRecord(record).then((result) => {
      if (result.ok) {
        setHistoryMode('supabase');
        fetchServerDialogHistory().then((history) => {
          if (history.ok) setDialogHistory(history.records);
        });
      }
    });
    setIsSending(false);
  };

  useEffect(() => {
    let alive = true;
    fetchServerDialogHistory().then((result) => {
      if (!alive) return;
      if (result.ok && result.records.length) {
        setDialogHistory(result.records);
        setHistoryMode('supabase');
      } else if (result.configured) {
        setHistoryMode('supabase');
      }
    });
    return () => { alive = false; };
  }, []);

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
    <main className="appShell">
      <aside className="leftRail" aria-label="Главное меню">
        <button
          className="active"
          type="button"
          title="Тренажёр"
          aria-label="Тренажёр"
        >
          <span>ТР</span>
        </button>
      </aside>

      <section className="appContent">
        <header className="top">
          <div>
            <p className="kicker">Тренажёр турагента</p>
            <h1>Ответьте клиенту. Получите короткий разбор.</h1>
          </div>
          {lastEvaluation && <button className="linkButton" onClick={resetAttempt}>Новый ответ</button>}
        </header>

        <section className="layout">
            <section className="card situations">
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
                  <button className="ghost" onClick={() => setIsTravelMemoOpen(true)}>Памятка документов</button>
                  <button className="ghost" onClick={copyDialogue}>Скопировать диалог</button>
                  <button className="ghost" onClick={resetAttempt}>Очистить</button>
                </div>
              </div>
              {copyState && <p className="copyState">{copyState}</p>}
              {activePhase === 'selection-review' && <SelectionAnalysisCard analysis={selectionAnalysis} />}

              <div className="dialogWindow" aria-label="Диалог с клиентом">
                {messages.map((message) => (
                  <article key={message.id} className={`dialogMessage ${message.role}`}>
                    <span>{message.role === 'client' ? 'Клиент' : 'Вы'}</span>
                    <p>{message.text}</p>
                    <small>{message.time}</small>
                  </article>
                ))}
              </div>

              <div className="selectionInputBox">
                <label>
                  <span>Подборка менеджера для анализа</span>
                  <textarea
                    value={selectionInput}
                    onChange={(event) => setSelectionInput(event.target.value)}
                    placeholder="Вставьте реальную ссылку на подборку или текст/названия отелей. Без этого клиент не будет имитировать анализ."
                  />
                </label>
                <button type="button" onClick={analyzeRealSelection} disabled={isAnalyzingSelection}>
                  {isAnalyzingSelection ? 'Анализирую...' : 'Проанализировать подборку'}
                </button>
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
              <TravelRequirementsDrawer
                checklist={travelChecklist}
                checkedItems={checkedTravelItems}
                isOpen={isTravelMemoOpen}
                onClose={() => setIsTravelMemoOpen(false)}
                onToggle={toggleTravelItem}
                onReset={resetTravelChecklist}
              />
            </section>
          </section>
      </section>
    </main>
  );
}

function SelectionAnalysisCard({ analysis }) {
  if (!analysis) return null;
  return (
    <section className="selectionCard">
      <div>
        <p className="kicker">Этап после ссылки</p>
        <h3>Клиент изучил подборку · качество {analysis.qualityScore}/100</h3>
      </div>
      <p><b>Что проверил клиент:</b> страна, отели, звёзды, удобства, бюджет, компромиссы, Яндекс и Tripadvisor.</p>
      <p><b>Исходные критерии:</b> {analysis.criteria.join(', ')}</p>
      <p><b>Проблема:</b> {analysis.gaps.join(' ') || 'Критичных разрывов нет.'}</p>
      <p><b>Что должен сделать менеджер:</b> {analysis.managerTask}</p>
    </section>
  );
}

function TravelRequirementsDrawer({ checklist, checkedItems, isOpen, onClose, onToggle, onReset }) {
  if (!isOpen) return null;
  const doneCount = checklist.checks.filter((item) => checkedItems[item.id]).length;

  return (
    <aside className="travelDrawer" aria-label="Памятка документов для менеджера">
      <div className="travelDrawerHead">
        <div>
          <p className="kicker">Памятка перед оплатой</p>
          <h2>{checklist.country} · документы и въезд</h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Закрыть памятку">×</button>
      </div>

      <p className="travelSummary">{checklist.summary}</p>
      {checklist.clientContext && <p className="travelContext">Контекст клиента: {checklist.clientContext}</p>}
      <p className="travelWarning">{checklist.warning}</p>

      <section className="travelBlock">
        <h3>Что уточнить у клиента</h3>
        <ol>
          {checklist.questions.map((question) => <li key={question}>{question}</li>)}
        </ol>
      </section>

      <section className="travelBlock">
        <div className="travelChecklistHead">
          <h3>Чеклист менеджера</h3>
          <span>{doneCount}/{checklist.checks.length}</span>
        </div>
        <div className="travelChecks">
          {checklist.checks.map((item) => (
            <label key={item.id} className={checkedItems[item.id] ? 'done' : ''}>
              <input type="checkbox" checked={Boolean(checkedItems[item.id])} onChange={() => onToggle(item.id)} />
              <span>{item.text}</span>
            </label>
          ))}
        </div>
        <button className="ghost resetMemo" type="button" onClick={onReset}>Сбросить отметки</button>
      </section>

      <section className="travelBlock sources">
        <h3>Источники для свежей проверки</h3>
        {checklist.sourceNotes.map((source) => <p key={source}>• {source}</p>)}
        <small>{checklist.sourcePolicy}</small>
      </section>
    </aside>
  );
}

function HistoryPanel({ records, mode, onOpen, onCopy, onDelete, onClear }) {
  return (
    <section className="historyPanel">
      <div className="historyHead">
        <h2>История тестов</h2>
        {!!records.length && <button className="ghost danger" type="button" onClick={onClear}>Очистить</button>}
      </div>
      <p className="historyMode">Хранилище: {mode === 'supabase' ? 'Supabase база' : 'локально в этом браузере'}</p>
      {!records.length ? (
        <p className="emptyHistory">Пока пусто. Пройдите диалог — он сохранится здесь автоматически.</p>
      ) : (
        <div className="historyList">
          {records.map((record) => (
            <article className="historyItem" key={record.id}>
              <small>{new Date(record.createdAt).toLocaleString('ru-RU')} · {record.level}</small>
              <b>{record.scenarioTitle}</b>
              <span>{record.score !== null ? `${record.score}/100 · ${record.verdict}` : 'без оценки'}</span>
              <p>{record.lastClient || record.lastAgent}</p>
              <div className="historyActions">
                <button type="button" onClick={() => onOpen(record)}>Открыть</button>
                <button type="button" onClick={() => onCopy(record)}>Копировать</button>
                <button type="button" onClick={() => onDelete(record.id)}>Удалить</button>
              </div>
            </article>
          ))}
        </div>
      )}
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

