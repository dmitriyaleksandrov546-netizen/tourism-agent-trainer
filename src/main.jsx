import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { createInitialMessages, evaluateAgentReply, getScenarioById, scenarios, shouldShowEvaluationReview } from './simulatorEngine.js';
import { requestNeuroclientReply } from './neuroclientApi.js';
import { requestSelectionAnalysis } from './selectionAnalysisApi.js';
import { shouldAnalyzeSelectionFromMessage } from './selectionAnalysis.js';
import { buildTravelDocumentChecklist } from './travelRequirements.js';
import { requestTravelDocumentMonitoring } from './travelDocumentMonitoringApi.js';
import { shouldRenderAnswerReview, shouldRenderDailySourceControl, shouldRenderFreshSources } from './uiVisibility.js';
import { buildFreshSourcesTooltip, buildIntegratedMemoRows, formatClientContext } from './travelMemoUi.js';
import { CLIENT_REPLY_IDLE_DELAY_MS, shouldDelayClientReply } from './clientReplyDelay.js';
import {
  clearDialogHistory,
  clearCurrentAttempt,
  clearScenarioAttempt,
  createDialogRecord,
  formatDialogRecord,
  loadCurrentAttempt,
  loadDialogHistory,
  loadScenarioAttempt,
  mergeIncrementalDialogRecords,
  removeDialogRecord,
  saveScenarioAttempt,
  upsertDialogRecord
} from './dialogHistoryStore.js';
import { deleteServerDialogRecord, fetchServerDialogHistory, saveServerDialogRecord } from './dialogHistoryApi.js';
import {
  buildAdminSummary,
  buildTestResume,
  createTrainingAccount,
  filterRecordsByAccount,
  getActiveTrainingAccount,
  loadActiveTrainingAccountId,
  loadTrainingAccounts,
  normalizeHistoryRecordsForAdmin,
  setActiveTrainingAccount,
  touchTrainingAccount
} from './adminStore.js';
import { pathForView, viewFromPath } from './adminNavigation.js';
import './styles.css';

function createClientDialogId() {
  return `dialog-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeVisibleDialogHistory(records = []) {
  return normalizeHistoryRecordsForAdmin(mergeIncrementalDialogRecords(records));
}

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
  const [dialogHistory, setDialogHistory] = useState(() => normalizeVisibleDialogHistory(loadDialogHistory()));
  const [historyMode, setHistoryMode] = useState('local');
  const [activeView, setActiveViewState] = useState(() => viewFromPath(window.location.pathname));
  const [adminAccounts, setAdminAccounts] = useState(() => loadTrainingAccounts());
  const [activeAccountId, setActiveAccountId] = useState(() => loadActiveTrainingAccountId());
  const [newAccountLogin, setNewAccountLogin] = useState('');
  const [newAccountPassword, setNewAccountPassword] = useState('');
  const [selectedHistoryRecord, setSelectedHistoryRecord] = useState(null);
  const [adminNotice, setAdminNotice] = useState('');
  const [isTravelMemoOpen, setIsTravelMemoOpen] = useState(false);
  const [travelMonitoring, setTravelMonitoring] = useState(null);
  const [isMonitoringTravelDocs, setIsMonitoringTravelDocs] = useState(false);
  const [checkedTravelItems, setCheckedTravelItems] = useState(restoredAttempt?.checkedTravelItems || {});
  const draftRef = useRef(draft);
  const delayedClientTimerRef = useRef(null);
  const dialogRecordIdRef = useRef(restoredAttempt?.dialogRecordId || createClientDialogId());
  const dialogCreatedAtRef = useRef(restoredAttempt?.dialogCreatedAt || new Date().toISOString());
  const serverDialogRecordIdRef = useRef(restoredAttempt?.serverDialogRecordId || '');
  const serverSaveChainRef = useRef(Promise.resolve());

  const activeScenario = useMemo(() => getScenarioById(activeScenarioId), [activeScenarioId]);
  const travelChecklist = useMemo(() => buildTravelDocumentChecklist(activeScenario), [activeScenario]);
  const activeAccount = useMemo(() => (
    adminAccounts.find((account) => account.id === activeAccountId) || getActiveTrainingAccount(adminAccounts)
  ), [adminAccounts, activeAccountId]);
  const selectedAccountRecords = useMemo(() => filterRecordsByAccount(dialogHistory, activeAccount?.id || ''), [dialogHistory, activeAccount]);
  const adminSummary = useMemo(() => buildAdminSummary(dialogHistory, adminAccounts, activeAccount?.id || ''), [dialogHistory, adminAccounts, activeAccount]);

  const setActiveView = (view) => {
    setActiveViewState(view);
    const path = pathForView(view);
    if (window.location.pathname !== path) window.history.pushState({}, '', path);
  };

  const clearDelayedClientReply = () => {
    if (delayedClientTimerRef.current) {
      clearTimeout(delayedClientTimerRef.current);
      delayedClientTimerRef.current = null;
    }
  };

  const updateDraft = (value) => {
    setDraft(value);
    draftRef.current = value;
    if (value.trim()) clearDelayedClientReply();
  };

  const selectScenario = (id) => {
    if (id === activeScenarioId) return;
    clearDelayedClientReply();
    const savedAttempt = loadScenarioAttempt(id);
    const nextDialogId = savedAttempt?.dialogRecordId || createClientDialogId();
    dialogRecordIdRef.current = nextDialogId;
    dialogCreatedAtRef.current = savedAttempt?.dialogCreatedAt || new Date().toISOString();
    serverDialogRecordIdRef.current = savedAttempt?.serverDialogRecordId || '';
    setActiveScenarioId(id);
    setMessages(savedAttempt?.messages?.length ? savedAttempt.messages : createInitialMessages(id, Date.now()));
    updateDraft(savedAttempt?.draft || '');
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
    clearDelayedClientReply();
    clearCurrentAttempt();
    clearScenarioAttempt(activeScenarioId);
    dialogRecordIdRef.current = createClientDialogId();
    dialogCreatedAtRef.current = new Date().toISOString();
    serverDialogRecordIdRef.current = '';
    setMessages(createInitialMessages(activeScenarioId, Date.now()));
    updateDraft('');
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

  const copyText = async (text, okText = '') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopyState(okText);
    } catch (_error) {
      setCopyState('Не удалось скопировать');
    }
  };

  const copyDialogue = async () => {
    const record = createDialogRecord({ scenario: activeScenario, messages, evaluation: lastEvaluation, account: activeAccount });
    const text = formatDialogRecord({ ...record, messages: draft.trim() ? [...messages, { role: 'agent', text: draft.trim() }] : messages });
    await copyText(text);
  };

  const copyHistoryRecord = async (record) => copyText(formatDialogRecord(record), 'Диалог скопирован');

  const openHistoryRecord = (record) => {
    dialogRecordIdRef.current = record.id || createClientDialogId();
    dialogCreatedAtRef.current = record.createdAt || new Date().toISOString();
    serverDialogRecordIdRef.current = record.serverId || (/^[0-9a-f-]{36}$/i.test(record.id || '') ? record.id : '');
    setActiveScenarioId(record.scenarioId);
    setMessages(record.messages || []);
    updateDraft('');
    setLastEvaluation(record.score !== null ? { score: record.score, verdict: record.verdict, dimensions: [], topFixes: [] } : null);
    setCopyState('Диалог открыт из истории');
  };

  const deleteHistoryRecord = (id) => {
    setDialogHistory(normalizeVisibleDialogHistory(removeDialogRecord(id)));
    deleteServerDialogRecord(id).then((result) => {
      if (result.ok) fetchServerDialogHistory().then((history) => history.ok && setDialogHistory(normalizeVisibleDialogHistory(history.records)));
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

  const selectTrainingAccount = (accountId) => {
    setActiveTrainingAccount(accountId);
    setActiveAccountId(accountId);
    setSelectedHistoryRecord(null);
    setAdminNotice('');
  };

  const addTrainingAccount = (event) => {
    event.preventDefault();
    const result = createTrainingAccount({ login: newAccountLogin, password: newAccountPassword });
    setAdminAccounts(result.accounts);
    if (result.ok) {
      setActiveAccountId(result.account.id);
      setSelectedHistoryRecord(null);
      setNewAccountLogin('');
      setNewAccountPassword('');
      setAdminNotice(result.account.id === 'admin-default' ? 'Пароль admin обновлён' : `Создан аккаунт: ${result.account.login}`);
    } else {
      setAdminNotice(result.error);
    }
  };

  const refreshAdminData = () => {
    setDialogHistory(normalizeVisibleDialogHistory(loadDialogHistory()));
    setAdminAccounts(loadTrainingAccounts());
    fetchServerDialogHistory().then((history) => {
      if (history.ok) {
        setHistoryMode('supabase');
        setDialogHistory(normalizeVisibleDialogHistory(history.records));
      }
    });
    setAdminNotice('Данные обновлены');
  };

  const persistDialog = (finalMessages, evaluation = null) => {
    const record = createDialogRecord({
      scenario: activeScenario,
      messages: finalMessages,
      evaluation,
      account: activeAccount,
      id: dialogRecordIdRef.current,
      createdAt: dialogCreatedAtRef.current,
      serverId: serverDialogRecordIdRef.current
    });
    setDialogHistory(normalizeVisibleDialogHistory(upsertDialogRecord(record)));
    if (activeAccount?.id) setAdminAccounts(touchTrainingAccount(activeAccount.id));
    serverSaveChainRef.current = serverSaveChainRef.current
      .catch(() => null)
      .then(() => saveServerDialogRecord(record, { serverRecordId: serverDialogRecordIdRef.current }))
      .then((result) => {
        if (result.ok) {
          serverDialogRecordIdRef.current = result.record?.id || serverDialogRecordIdRef.current;
          setHistoryMode('supabase');
          saveScenarioAttempt({
            scenarioId: activeScenarioId,
            messages: finalMessages,
            draft: draftRef.current,
            lastEvaluation: evaluation,
            activePhase,
            selectionAnalysis,
            checkedTravelItems,
            dialogRecordId: dialogRecordIdRef.current,
            dialogCreatedAt: dialogCreatedAtRef.current,
            serverDialogRecordId: serverDialogRecordIdRef.current
          });
        }
        return result;
      });
  };

  const scheduleClientReply = ({ thinkingId, nextMessages, text, turn, history, evaluation }) => {
    clearDelayedClientReply();
    delayedClientTimerRef.current = setTimeout(async () => {
      delayedClientTimerRef.current = null;
      if (draftRef.current.trim()) return;

      const waitingMessages = [
        ...nextMessages,
        { id: thinkingId, role: 'client', text: '...', time: 'клиент думает' }
      ];
      setMessages(waitingMessages);
      setIsSending(true);

      try {
        const reply = await requestNeuroclientReply({ scenarioId: activeScenarioId, agentText: text, turn, history, phase: activePhase, selectionAnalysis });
        const finalMessages = waitingMessages.map((message) => (
          message.id === thinkingId
            ? { ...message, text: reply.text, time: reply.source === 'openai' ? 'AI-клиент' : 'ответ клиента' }
            : message
        ));
        setMessages(finalMessages);
        persistDialog(finalMessages, evaluation);
      } finally {
        setIsSending(false);
      }
    }, CLIENT_REPLY_IDLE_DELAY_MS);
  };

  const sendReply = async () => {
    const text = draft.trim();
    if (!text || isSending) return;
    clearDelayedClientReply();

    const isSelectionMessage = shouldAnalyzeSelectionFromMessage(text);
    const shouldShowReview = !isSelectionMessage && shouldShowEvaluationReview({ messages, agentText: text, phase: activePhase });
    const evaluation = shouldShowReview ? evaluateAgentReply(text, activeScenario, { phase: activePhase }) : null;
    const turn = messages.filter((m) => m.role === 'agent').length + 1;
    const thinkingId = `client-thinking-${Date.now()}`;
    const nextMessages = [
      ...messages,
      { id: `agent-${messages.length}`, role: 'agent', text, time: isSelectionMessage ? 'подборка от менеджера' : 'ваш ответ' }
    ];

    setMessages(nextMessages);
    setLastEvaluation(evaluation);
    updateDraft('');
    setIsSending(isSelectionMessage);

    if (isSelectionMessage) {
      setCopyState('Клиент изучает подборку прямо в диалоге...');
      try {
        const result = await requestSelectionAnalysis({ scenarioId: activeScenarioId, selectionInput: text });
        const analysis = result.analysis;
        const selectionWasAccessible = !result.fetchError;
        const finalMessages = [
          ...nextMessages,
          { id: thinkingId, role: 'client', text: analysis.clientReply, time: selectionWasAccessible ? 'клиент изучил подборку' : 'клиент не смог открыть ссылку' }
        ];
        setSelectionAnalysis(analysis);
        setActivePhase('selection-review');
        setMessages(finalMessages);
        setCopyState(selectionWasAccessible ? 'Подборка разобрана в диалоге' : 'Ссылка не открылась — клиент попросил доступный текст/скрин.');
        persistDialog(finalMessages, null);
      } catch (error) {
        const finalMessages = [
          ...nextMessages,
          { id: thinkingId, role: 'client', text: 'Я не смогла открыть или прочитать подборку. Пришлите текст, скрин или названия отелей — тогда смогу оценить нормально.', time: 'ошибка анализа' }
        ];
        setMessages(finalMessages);
        setCopyState('Не удалось открыть подборку автоматически — клиент попросил текст, скрин или названия отелей.');
        persistDialog(finalMessages, null);
      } finally {
        setIsSending(false);
      }
      return;
    }

    if (shouldDelayClientReply({ isSelectionMessage })) {
      persistDialog(nextMessages, evaluation);
      scheduleClientReply({ thinkingId, nextMessages, text, turn, history: messages, evaluation });
    }
  };

  useEffect(() => {
    let alive = true;
    fetchServerDialogHistory().then((result) => {
      if (!alive) return;
      if (result.ok && result.records.length) {
        setDialogHistory(normalizeVisibleDialogHistory(result.records));
        setHistoryMode('supabase');
      } else if (result.configured) {
        setHistoryMode('supabase');
      }
    });
    return () => { alive = false; };
  }, []);

  useEffect(() => () => clearDelayedClientReply(), []);

  useEffect(() => {
    const syncViewFromPath = () => setActiveViewState(viewFromPath(window.location.pathname));
    window.addEventListener('popstate', syncViewFromPath);
    return () => window.removeEventListener('popstate', syncViewFromPath);
  }, []);

  useEffect(() => {
    saveScenarioAttempt({
      scenarioId: activeScenarioId,
      messages,
      draft,
      lastEvaluation,
      activePhase,
      selectionAnalysis,
      checkedTravelItems,
      dialogRecordId: dialogRecordIdRef.current,
      dialogCreatedAt: dialogCreatedAtRef.current,
      serverDialogRecordId: serverDialogRecordIdRef.current
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
          className={activeView === 'trainer' ? 'active' : ''}
          type="button"
          title="Тренажёр"
          aria-label="Тренажёр"
          onClick={() => setActiveView('trainer')}
        >
          <span aria-hidden="true">▤</span>
        </button>
        <button
          className={activeView === 'admin' ? 'active' : ''}
          type="button"
          title="Админка"
          aria-label="Админка"
          onClick={() => setActiveView('admin')}
        >
          <span aria-hidden="true">☷</span>
        </button>
        <div className="railSpacer" aria-hidden="true" />
        <button
          className={activeView === 'accounts' ? 'accountAvatarButton active' : 'accountAvatarButton'}
          type="button"
          title="Аккаунты"
          aria-label="Аккаунты"
          onClick={() => setActiveView('accounts')}
        >
          A
        </button>
      </aside>

      <section className="appContent">
        {activeView === 'admin' ? (
          <AdminDashboard
            accounts={adminAccounts}
            activeAccountId={activeAccount?.id || ''}
            summary={adminSummary}
            records={selectedAccountRecords}
            selectedRecord={selectedHistoryRecord}
            mode={historyMode}
            onSelectAccount={selectTrainingAccount}
            onInspectRecord={setSelectedHistoryRecord}
            onCopyRecord={copyHistoryRecord}
            onDeleteRecord={deleteHistoryRecord}
            onClearRecords={clearHistory}
          />
        ) : activeView === 'accounts' ? (
          <AccountsAdminPage
            accounts={adminAccounts}
            activeAccountId={activeAccount?.id || ''}
            summary={adminSummary}
            notice={adminNotice}
            newAccountLogin={newAccountLogin}
            newAccountPassword={newAccountPassword}
            onAccountLoginChange={setNewAccountLogin}
            onAccountPasswordChange={setNewAccountPassword}
            onCreateAccount={addTrainingAccount}
            onSelectAccount={selectTrainingAccount}
          />
        ) : (
          <>
            <header className="top">
              <div>
                <p className="kicker">Тренажёр турагента</p>
                <h1>Ответьте клиенту. Получите короткий разбор.</h1>
              </div>
              {lastEvaluation && <button className="linkButton iconOnly" onClick={resetAttempt} title="Заново" aria-label="Заново">↻</button>}
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
                      <button className="memoAction" onClick={openTravelMemo} title="Памятка документов" aria-label="Памятка документов"><span aria-hidden="true">!</span>Памятка</button>
                      <button className="ghost iconOnly" onClick={copyDialogue} title="Скопировать диалог" aria-label="Скопировать диалог">⧉</button>
                      <button className="ghost iconOnly" onClick={resetAttempt} title="Заново" aria-label="Заново">↻</button>
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
                      onChange={(event) => updateDraft(event.target.value)}
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
          </>
        )}
      </section>
    </main>
  );
}

function AdminDashboard({
  accounts,
  activeAccountId,
  summary,
  records,
  selectedRecord,
  mode,
  onSelectAccount,
  onInspectRecord,
  onCopyRecord,
  onDeleteRecord,
  onClearRecords
}) {
  const activeAccount = accounts.find((account) => account.id === activeAccountId);
  const activeAnalytics = activeAccount ? summary.analytics.find((row) => row.account.id === activeAccount.id) : null;
  const openedRecord = selectedRecord || records[0] || null;

  return (
    <section className="adminPage adminWorkspacePage">
      <header className="top adminTop compactAdminTop">
        <div>
          <p className="kicker">Админка T-TRAINER</p>
          <h1>История и резюме тестов</h1>
        </div>
      </header>

      <section className="adminWorkspace">
        <aside className="card adminCard adminHistorySticky">
          <HistoryPanel
            records={records}
            mode={mode}
            activeAccount={activeAccount}
            activeRecordId={openedRecord?.id || ''}
            onInspect={onInspectRecord}
            onCopy={onCopyRecord}
            onDelete={onDeleteRecord}
            onClear={onClearRecords}
          />
        </aside>

        <section className="card adminCard adminResumePane">
          <DialogLogPanel record={openedRecord} />
        </section>

        <aside className="accountSidePanel" aria-label="Аккаунты и статистика">
          <div className="accountSideHead">
            <span>Аккаунты</span>
            <b>{summary.accountCount}</b>
          </div>
          <div className="accountSwitchList">
            {summary.analytics.map((row) => (
              <button
                type="button"
                key={row.account.id}
                className={row.account.id === activeAccountId ? 'active' : ''}
                onClick={() => onSelectAccount(row.account.id)}
              >
                <b>{row.account.login || row.account.name}</b>
                <span>{row.attempts} тестов · ср. {row.averageScore ?? '—'}</span>
              </button>
            ))}
          </div>
          <div className="accountMiniStats">
            <article><span>Попытки</span><b>{activeAnalytics?.attempts ?? 0}</b></article>
            <article><span>С оценкой</span><b>{activeAnalytics?.completed ?? 0}</b></article>
            <article><span>Средний</span><b>{activeAnalytics?.averageScore ?? '—'}</b></article>
            <article><span>Лучший</span><b>{activeAnalytics?.bestScore ?? '—'}</b></article>
          </div>
        </aside>
      </section>
    </section>
  );
}

function AccountsAdminPage({
  accounts,
  activeAccountId,
  summary,
  notice,
  newAccountLogin,
  newAccountPassword,
  onAccountLoginChange,
  onAccountPasswordChange,
  onCreateAccount,
  onSelectAccount
}) {
  return (
    <section className="accountsPage">
      <header className="top adminTop compactAdminTop">
        <div>
          <p className="kicker">Технический раздел</p>
          <h1>Создание аккаунтов</h1>
        </div>
      </header>

      <section className="accountsAdminGrid">
        <section className="card accountsCreateCard">
          <h2>Новый аккаунт</h2>
          <form className="accountForm accountFormLarge" onSubmit={onCreateAccount}>
            <input
              value={newAccountLogin}
              onChange={(event) => onAccountLoginChange(event.target.value)}
              placeholder="Логин"
              aria-label="Логин"
              autoComplete="username"
            />
            <input
              value={newAccountPassword}
              onChange={(event) => onAccountPasswordChange(event.target.value)}
              placeholder="Пароль"
              aria-label="Пароль"
              type="password"
              autoComplete="new-password"
            />
            <button type="submit" className="primary compactPrimary">Сохранить</button>
          </form>
          {notice && <p className="accountNotice">{notice}</p>}
        </section>

        <section className="card accountsCreateCard">
          <div className="historyHead">
            <h2>Аккаунты</h2>
            <span className="scorePill">{summary.accountCount}</span>
          </div>
          <div className="accountList technicalAccountList">
            {summary.analytics.map((row) => (
              <button
                type="button"
                key={row.account.id}
                className={row.account.id === activeAccountId ? 'active' : ''}
                onClick={() => onSelectAccount(row.account.id)}
              >
                <b>{row.account.login || row.account.name}</b>
                <span>{row.attempts} прох. · ср. {row.averageScore ?? '—'} · лучш. {row.bestScore ?? '—'}</span>
                <small>{row.lastActivityAt ? new Date(row.lastActivityAt).toLocaleString('ru-RU') : 'ещё не проходил'}</small>
              </button>
            ))}
          </div>
        </section>
      </section>
    </section>
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

      {checklist.clientContext && <p className="travelContext">{formatClientContext(checklist.clientContext)}</p>}
      {checklist.warning && <p className="travelWarning">{checklist.warning}</p>}

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
      </section>

      <section className="travelBlock">
        <h3>Что уточнить у клиента</h3>
        <ol>
          {checklist.questions.map((question) => <li key={question}>{question}</li>)}
        </ol>
      </section>

      {shouldRenderFreshSources(checklist) && (
        <section className="travelBlock sources monitoringBlock">
          <div className="sourceTitleRow">
            <h3>Актуализация официальных данных</h3>
            <span className="infoIcon" tabIndex="0" aria-label={freshSourcesTooltip} title={freshSourcesTooltip}>i</span>
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
      )}

      {shouldRenderDailySourceControl(checklist) && (
        <section className="travelBlock sources">
          <h3>Ежедневный контроль источников</h3>
          <p>• Периодичность: каждый день</p>
          <p>• Что сверяем: {checklist.dailyMonitoring.scope}</p>
          <p>• Что получает менеджер: {checklist.dailyMonitoring.managerOutcome}</p>
          <h3>Актуализация официальных данных</h3>
          {checklist.sourceNotes.map((source) => <p key={source}>• {source}</p>)}
          <small>{checklist.sourcePolicy}</small>
        </section>
      )}
    </aside>
  );
}

function HistoryPanel({ records, mode, activeAccount, activeRecordId, onInspect, onCopy, onDelete, onClear }) {
  return (
    <section className="historyPanel">
      <div className="historyHead">
        <h2>История тестов{activeAccount ? ` · ${activeAccount.login || activeAccount.name}` : ''}</h2>
      </div>
      {!activeAccount ? (
        <p className="emptyHistory">Выберите аккаунт слева — здесь появятся только его тесты.</p>
      ) : !records.length ? (
        <p className="emptyHistory">У выбранного аккаунта пока нет прохождений.</p>
      ) : (
        <div className="historyList">
          {records.map((record) => {
            const resume = buildTestResume(record);
            return (
              <article
                className={record.id === activeRecordId ? 'historyItem active' : 'historyItem'}
                key={record.id}
                role="button"
                tabIndex="0"
                onClick={() => onInspect(record)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onInspect(record);
                  }
                }}
              >
                <small>{new Date(record.createdAt).toLocaleString('ru-RU')} · {record.level}</small>
                <b>{record.scenarioTitle}</b>
                <span>{resume.resultLabel}</span>
                <div className="historyActions">
                  <button type="button" onClick={(event) => { event.stopPropagation(); onCopy(record); }} onKeyDown={(event) => event.stopPropagation()} title="Копировать" aria-label="Копировать диалог">⧉</button>
                  <button type="button" onClick={(event) => { event.stopPropagation(); onDelete(record.id); }} onKeyDown={(event) => event.stopPropagation()} title="Удалить" aria-label="Удалить диалог">🗑</button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DialogLogPanel({ record }) {
  if (!record) {
    return (
      <section className="dialogLogPanel">
        <h2>Резюме теста</h2>
        <p className="emptyHistory">Выберите диалог в истории — здесь будет резюме и история диалога.</p>
      </section>
    );
  }
  const resume = buildTestResume(record);
  return (
    <section className="dialogLogPanel">
      <div className="historyHead">
        <h2>Резюме теста</h2>
        <span className="scorePill">{resume.resultLabel}</span>
      </div>
      <div className="resumeGrid compactResumeGrid">
        <article><span>Ответов менеджера</span><b>{resume.turns}</b></article>
        <article><span>Сообщений клиента</span><b>{resume.clientMessages}</b></article>
      </div>
      <div className="dialogLogList messengerLogList">
        <h3>История диалога</h3>
        {(record.messages || []).map((message, index) => (
          <article key={`${message.id || message.role}-${index}`} className={`logMessage ${message.role}`}>
            <span>{message.role === 'client' ? 'Клиент' : 'Менеджер'} · {message.time || '—'}</span>
            <p>{message.text}</p>
          </article>
        ))}
      </div>
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

