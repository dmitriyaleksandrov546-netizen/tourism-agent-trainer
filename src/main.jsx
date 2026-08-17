import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createInitialMessages, evaluateAgentReply, getScenarioById, scenarios, shouldShowEvaluationReview } from './simulatorEngine.js';
import { requestNeuroclientReply } from './neuroclientApi.js';
import { requestSelectionAnalysis } from './selectionAnalysisApi.js';
import { shouldAnalyzeSelectionFromMessage } from './selectionAnalysis.js';
import { buildTravelDocumentChecklist } from './travelRequirements.js';
import { requestTravelDocumentMonitoring } from './travelDocumentMonitoringApi.js';
import { shouldRenderAnswerReview, shouldRenderDailySourceControl, shouldRenderFreshSources } from './uiVisibility.js';
import { buildFreshSourcesTooltip, buildIntegratedMemoRows } from './travelMemoUi.js';
import {
  clearDialogHistory,
  clearCurrentAttempt,
  clearScenarioAttempt,
  createDialogRecord,
  formatDialogRecord,
  loadCurrentAttempt,
  loadDialogHistory,
  loadScenarioAttempt,
  removeDialogRecord,
  saveScenarioAttempt,
  upsertDialogRecord
} from './dialogHistoryStore.js';
import { deleteServerDialogRecord, fetchServerDialogHistory, saveServerDialogRecord } from './dialogHistoryApi.js';
import './styles.css';

function App() {
  const restoredAttempt = useMemo(() => loadCurrentAttempt(), []);
  const [activeScenarioId, setActiveScenarioId] = useState(restoredAttempt?.scenarioId || 'turkey-family-hard');
  const [messages, setMessages] = useState(() => restoredAttempt?.messages?.length ? restoredAttempt.messages : createInitialMessages(restoredAttempt?.scenarioId || 'turkey-family-hard'));
  const [draft, setDraft] = useState(restoredAttempt?.draft || '');
  const [lastEvaluation, setLastEvaluation] = useState(restoredAttempt?.lastEvaluation || null);
  const [activePhase, setActivePhase] = useState(restoredAttempt?.activePhase || 'dialogue');
  const [selectionAnalysis, setSelectionAnalysis] = useState(restoredAttempt?.selectionAnalysis || null);
  const [isSending, setIsSending] = useState(false);
  const [copyState, setCopyState] = useState('');
  const [dialogHistory, setDialogHistory] = useState(() => loadDialogHistory());
  const [historyMode, setHistoryMode] = useState('local');
  const [isTravelMemoOpen, setIsTravelMemoOpen] = useState(false);
  const [travelMonitoring, setTravelMonitoring] = useState(null);
  const [isMonitoringTravelDocs, setIsMonitoringTravelDocs] = useState(false);
  const [checkedTravelItems, setCheckedTravelItems] = useState(restoredAttempt?.checkedTravelItems || {});

  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);
  const travelChecklist = useMemo(() => buildTravelDocumentChecklist(activeScenario), [activeScenario]);

  const selectScenario = (id) => {
    if (id === activeScenarioId) return;
    const savedAttempt = loadScenarioAttempt(id);
    setActiveScenarioId(id);
    setMessages(savedAttempt?.messages?.length ? savedAttempt.messages : createInitialMessages(id, Date.now()));
    setDraft(savedAttempt?.draft || '');
    setLastEvaluation(savedAttempt?.lastEvaluation || null);
    setSelectionAnalysis(savedAttempt?.selectionAnalysis || null);
    setActivePhase(savedAttempt?.activePhase || 'dialogue');
    setIsSending(false);
    setCopyState('');
    setIsTravelMemoOpen(false);
    setTravelMonitoring(null);
    setIsMonitoringTravelDocs(false);
    setCheckedTravelItems(savedAttempt?.checkedTravelItems || {});
  };

  const resetAttempt = () => {
    clearCurrentAttempt();
    clearScenarioAttempt(activeScenarioId);
    setMessages(createInitialMessages(activeScenarioId, Date.now()));
    setDraft('');
    setLastEvaluation(null);
    setSelectionAnalysis(null);
    setActivePhase('dialogue');
    setIsSending(false);
    setCopyState('');
    setIsTravelMemoOpen(false);
    setTravelMonitoring(null);
    setIsMonitoringTravelDocs(false);
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

  const openTravelMemo = async () => {
    setIsTravelMemoOpen(true);
    setIsMonitoringTravelDocs(true);
    setTravelMonitoring(null);
    try {
      const report = await requestTravelDocumentMonitoring({ country: travelChecklist.country });
      setTravelMonitoring(report);
    } catch (error) {
      setTravelMonitoring({ ok: false, status: 'error', managerSummary: error?.message || 'Не удалось проверить источники', sources: [], changes: [] });
    } finally {
      setIsMonitoringTravelDocs(false);
    }
  };

  const clearHistory = () => {
    setDialogHistory(clearDialogHistory());
    setCopyState('История очищена');
  };

  const persistDialog = (finalMessages, evaluation = null) => {
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
  };

  const sendReply = async () => {
    const text = draft.trim();
    if (!text || isSending) return;

    const isSelectionMessage = shouldAnalyzeSelectionFromMessage(text);
    const shouldShowReview = !isSelectionMessage && shouldShowEvaluationReview({ messages, agentText: text, phase: activePhase });
    const evaluation = shouldShowReview ? evaluateAgentReply(text, activeScenario, { phase: activePhase }) : null;
    const turn = messages.filter((m) => m.role === 'agent').length + 1;
    const thinkingId = `client-thinking-${Date.now()}`;
    const nextMessages = [
      ...messages,
      { id: `agent-${messages.length}`, role: 'agent', text, time: isSelectionMessage ? 'подборка от менеджера' : 'ваш ответ' },
      { id: thinkingId, role: 'client', text: isSelectionMessage ? 'Изучаю подборку...' : '...', time: isSelectionMessage ? 'клиент изучает' : 'клиент думает' }
    ];

    setMessages(nextMessages);
    setLastEvaluation(evaluation);
    setDraft('');
    setIsSending(true);

    if (isSelectionMessage) {
      setCopyState('Клиент изучает подборку прямо в диалоге...');
      try {
        const result = await requestSelectionAnalysis({ scenarioId: activeScenarioId, selectionInput: text });
        const analysis = result.analysis;
        const selectionWasAccessible = !result.fetchError;
        const finalMessages = nextMessages.map((message) => (
          message.id === thinkingId
            ? { ...message, text: analysis.clientReply, time: selectionWasAccessible ? 'клиент изучил подборку' : 'клиент не смог открыть ссылку' }
            : message
        ));
        setSelectionAnalysis(analysis);
        setActivePhase('selection-review');
        setMessages(finalMessages);
        setCopyState(selectionWasAccessible ? 'Подборка разобрана в диалоге' : 'Ссылка не открылась — клиент попросил доступный текст/скрин.');
        persistDialog(finalMessages, null);
      } catch (error) {
        const finalMessages = nextMessages.map((message) => (
          message.id === thinkingId
            ? { ...message, text: 'Я не смогла открыть или прочитать подборку. Пришлите текст, скрин или названия отелей — тогда смогу оценить нормально.', time: 'ошибка анализа' }
            : message
        ));
        setMessages(finalMessages);
        setCopyState('Не удалось открыть подборку автоматически — клиент попросил текст, скрин или названия отелей.');
        persistDialog(finalMessages, null);
      } finally {
        setIsSending(false);
      }
      return;
    }

    const reply = await requestNeuroclientReply({ scenarioId: activeScenarioId, agentText: text, turn, history: messages, phase: activePhase, selectionAnalysis });
    const finalMessages = nextMessages.map((message) => (
      message.id === thinkingId
        ? { ...message, text: reply.text, time: reply.source === 'openai' ? 'AI-клиент' : 'ответ клиента' }
        : message
    ));
    setMessages(finalMessages);
    persistDialog(finalMessages, evaluation);
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
    saveScenarioAttempt({
      scenarioId: activeScenarioId,
      messages,
      draft,
      lastEvaluation,
      activePhase,
      selectionAnalysis,
      checkedTravelItems
    });
  }, [activeScenarioId, messages, draft, lastEvaluation, activePhase, selectionAnalysis, checkedTravelItems]);

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
          {lastEvaluation && <button className="linkButton" onClick={resetAttempt}>Заново</button>}
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
                  <button className="ghost" onClick={openTravelMemo}>Памятка документов</button>
                  <button className="ghost" onClick={copyDialogue}>Скопировать диалог</button>
                  <button className="ghost" onClick={resetAttempt}>Заново</button>
                </div>
              </div>
              {copyState && <p className="copyState">{copyState}</p>}

              {activeScenario.simulatedToday && (
                <div className="simulatedDate" aria-label="Текущая дата в сценарии">
                  <b>Текущая дата: {activeScenario.simulatedToday.label}</b>
                </div>
              )}

              <div className="dialogWindow" aria-label="Диалог с клиентом">
                {messages.map((message) => (
                  <article key={message.id} className={`dialogMessage ${message.role}`}>
                    <span>{message.role === 'client' ? 'Клиент' : 'Вы'}</span>
                    <p>{message.text}</p>
                    <small>{message.time}</small>
                  </article>
                ))}
              </div>

              <label className="answerBox" aria-label="Сообщение менеджера">
                <textarea
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Сообщение клиенту. Можно вставить ссылку или текст подборки — клиент разберёт её прямо в диалоге."
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' && !event.shiftKey) {
                      event.preventDefault();
                      sendReply();
                    }
                  }}
                />
              </label>

              <button className="primary" onClick={sendReply} disabled={isSending}>{isSending ? 'Отправляю...' : 'Отправить'}</button>

              {shouldRenderAnswerReview(lastEvaluation) && <Review evaluation={lastEvaluation} scenario={activeScenario} />}
              <TravelRequirementsDrawer
                checklist={travelChecklist}
                checkedItems={checkedTravelItems}
                isOpen={isTravelMemoOpen}
                monitoring={travelMonitoring}
                isMonitoring={isMonitoringTravelDocs}
                onClose={() => setIsTravelMemoOpen(false)}
                onToggle={toggleTravelItem}
              />
            </section>
          </section>
      </section>
    </main>
  );
}

function TravelRequirementsDrawer({ checklist, checkedItems, isOpen, monitoring, isMonitoring, onClose, onToggle }) {
  if (!isOpen) return null;
  const memoRows = buildIntegratedMemoRows(checklist);
  const doneCount = memoRows.filter((item) => checkedItems[item.id]).length;
  const freshSourcesTooltip = buildFreshSourcesTooltip(checklist);

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
      {checklist.clientContext && <p className="travelContext">{checklist.clientContext}</p>}
      {checklist.warning && <p className="travelWarning">{checklist.warning}</p>}

      <section className="travelBlock monitoringBlock">
        <div className="travelChecklistHead">
          <h3>Мониторинг правил</h3>
          <span>{isMonitoring ? 'проверка' : monitoring?.status || 'ожидает'}</span>
        </div>
        <p>{isMonitoring ? 'Сверяю источники...' : monitoring?.changes?.length ? monitoring.managerSummary : 'Изменений не найдено.'}</p>
        {!!monitoring?.changes?.length && (
          <div className="monitoringChanges">
            {monitoring.changes.map((change) => (
              <article key={change.id}>
                <b>{change.title}</b>
                <small>{change.url}</small>
                <p><b>Было:</b> {change.before}</p>
                <p><b>Стало:</b> {change.after}</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="travelBlock readyMemo">
        <div className="travelChecklistHead">
          <h3>Памятка менеджера</h3>
          <span>{doneCount}/{memoRows.filter((item) => item.checkable).length}</span>
        </div>
        <div className="readyList integratedMemoList">
          {memoRows.map((item) => (
            <label key={item.id} className={checkedItems[item.id] ? 'done' : ''}>
              <b>{item.label}</b>
              <span>{item.text}</span>
              {item.checkable ? (
                <input type="checkbox" checked={Boolean(checkedItems[item.id])} onChange={() => onToggle(item.id)} />
              ) : <i aria-hidden="true" />}
            </label>
          ))}
        </div>
        <div className="memoColumns">
          <div className="memoSection">
            <h4>Нужно подготовить</h4>
            <p>{checklist.requiredDocuments.join(' · ')}</p>
          </div>
          {!!checklist.notRequired.length && (
            <div className="memoSection">
              <h4>Не нужно</h4>
              <p>{checklist.notRequired.join(' · ')}</p>
            </div>
          )}
          <div className="memoSection">
            <h4>Проверить отдельно</h4>
            <p>{checklist.checkSeparately.join(' · ')}</p>
          </div>
        </div>
        <p className="managerPhrase"><b>Как сказать клиенту:</b> {checklist.managerPhrase}</p>
      </section>

      <section className="travelBlock">
        <h3>Что уточнить у клиента</h3>
        <ol>
          {checklist.questions.map((question) => <li key={question}>{question}</li>)}
        </ol>
      </section>

      {shouldRenderFreshSources(checklist) && (
        <section className="travelBlock sources">
          <div className="sourceTitleRow">
            <h3>Источники для свежей проверки</h3>
            <span className="infoIcon" tabIndex="0" aria-label={freshSourcesTooltip} title={freshSourcesTooltip}>i</span>
          </div>
        </section>
      )}

      {shouldRenderDailySourceControl(checklist) && (
        <section className="travelBlock sources">
          <h3>Ежедневный контроль источников</h3>
          <p>• Периодичность: каждый день</p>
          <p>• Что сверяем: {checklist.dailyMonitoring.scope}</p>
          <p>• Что получает менеджер: {checklist.dailyMonitoring.managerOutcome}</p>
          <h3>Источники для свежей проверки</h3>
          {checklist.sourceNotes.map((source) => <p key={source}>• {source}</p>)}
          <small>{checklist.sourcePolicy}</small>
        </section>
      )}
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

