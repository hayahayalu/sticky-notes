(() => {
  'use strict';

  const KEY = 'sticky.notes.v1';

  let todos = [];
  try { todos = JSON.parse(localStorage.getItem(KEY)) || []; } catch (e) { todos = []; }
  let filter = 'all';

  const listEl = document.getElementById('list');
  const inputEl = document.getElementById('input');
  const emptyEl = document.getElementById('empty');
  const statsEl = document.getElementById('stats');
  const btnAdd = document.getElementById('btn-add');
  const btnClearDone = document.getElementById('clear-done');
  const filterBtns = document.querySelectorAll('.filters button');

  // ---------- 工具 ----------
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  const save = () => localStorage.setItem(KEY, JSON.stringify(todos));

  const ICON_CHECK = '<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7"/></svg>';
  const ICON_PIN = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 17v5"/><path d="M9 10.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24V16h14v-.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1z"/></svg>';
  const ICON_TRASH = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6"/><path d="M14 11v6"/></svg>';

  function visibleTodos() {
    return todos
      .filter(t => filter === 'all' ? true : filter === 'active' ? !t.done : t.done)
      .sort((a, b) => (b.pinned - a.pinned) || (b.createdAt - a.createdAt));
  }

  // ---------- 渲染 ----------
  function render() {
    listEl.innerHTML = '';

    const items = visibleTodos();
    const hasAny = todos.length > 0;
    const showEmpty = items.length === 0;

    emptyEl.classList.toggle('show', showEmpty);
    if (!hasAny) {
      emptyEl.querySelector('.tip').textContent = '还没有便签，在上方输入框写下第一条吧';
    } else if (showEmpty) {
      emptyEl.querySelector('.tip').textContent = filter === 'done' ? '还没有完成的便签' : '太棒了，没有待办事项';
    }

    for (const t of items) listEl.appendChild(buildItem(t));

    const active = todos.filter(t => !t.done).length;
    const done = todos.length - active;
    statsEl.textContent = todos.length ? active + ' 项待办 · 已完成 ' + done : '一切从一条便签开始';
  }

  function buildItem(t) {
    const li = document.createElement('li');
    li.className = 'todo' + (t.done ? ' done' : '') + (t.pinned ? ' pinned' : '');
    li.dataset.id = t.id;

    // 勾选框
    const check = document.createElement('div');
    check.className = 'check';
    check.title = t.done ? '标记为待办' : '标记为已完成';
    check.innerHTML = ICON_CHECK;
    check.addEventListener('click', () => toggleDone(t.id));
    li.appendChild(check);

    // 文本（双击编辑）
    const span = document.createElement('span');
    span.className = 'text';
    span.textContent = t.text;
    span.title = '双击修改';
    span.addEventListener('dblclick', () => startEdit(li, span, t));
    li.appendChild(span);

    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'actions';

    const pin = document.createElement('button');
    pin.className = 'act-pin';
    pin.title = t.pinned ? '取消置顶' : '置顶';
    pin.innerHTML = ICON_PIN;
    pin.addEventListener('click', () => togglePin(t.id));
    actions.appendChild(pin);

    const del = document.createElement('button');
    del.className = 'del';
    del.title = '删除';
    del.innerHTML = ICON_TRASH;
    del.addEventListener('click', () => removeTodo(t.id));
    actions.appendChild(del);

    li.appendChild(actions);
    return li;
  }

  // ---------- 操作 ----------
  function addTodo() {
    const text = inputEl.value.trim();
    if (!text) { inputEl.focus(); return; }
    todos.unshift({ id: uid(), text, done: false, pinned: false, createdAt: Date.now() });
    save();
    inputEl.value = '';
    render();
  }

  function toggleDone(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    t.done = !t.done;
    save();

    const li = listEl.querySelector('[data-id="' + id + '"]');
    if (filter === 'all' && li) {
      li.classList.toggle('done', t.done);   // 原地更新，保留勾选动画
    } else {
      setTimeout(render, 350);               // 过滤视图下等动画播完再刷新
    }
  }

  function togglePin(id) {
    const t = todos.find(x => x.id === id);
    if (!t) return;
    t.pinned = !t.pinned;
    save();
    render();
  }

  function removeTodo(id) {
    const li = listEl.querySelector('[data-id="' + id + '"]');
    if (li) li.classList.add('leaving');
    setTimeout(() => {
      todos = todos.filter(x => x.id !== id);
      save();
      render();
    }, 260);
  }

  function startEdit(li, span, t) {
    const input = document.createElement('input');
    input.className = 'text-input';
    input.type = 'text';
    input.maxLength = 200;
    input.value = t.text;
    span.replaceWith(input);
    input.focus();
    input.select();

    let closed = false;
    const finish = (commit) => {
      if (closed) return;
      closed = true;
      if (commit) {
        const v = input.value.trim();
        if (v && v !== t.text) { t.text = v; save(); }
      }
      render();
    };

    input.addEventListener('blur', () => finish(true));
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') finish(true);
      if (e.key === 'Escape') finish(false);
    });
  }

  // ---------- 事件 ----------
  btnAdd.addEventListener('click', addTodo);
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTodo(); });

  btnClearDone.addEventListener('click', () => {
    const doneCount = todos.filter(t => t.done).length;
    if (!doneCount) return;
    todos = todos.filter(t => !t.done);
    save();
    render();
  });

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      filterBtns.forEach(b => b.classList.toggle('active', b === btn));
      render();
    });
  });

  // ---------- 日期 ----------
  const now = new Date();
  const week = ['日', '一', '二', '三', '四', '五', '六'][now.getDay()];
  document.getElementById('date').textContent =
    (now.getMonth() + 1) + ' 月 ' + now.getDate() + ' 日 · 星期' + week;

  // ---------- 窗口控制（浏览器预览时隐藏） ----------
  const winControls = document.getElementById('win-controls');
  if (window.winControls) {
    document.getElementById('btn-min').addEventListener('click', () => window.winControls.minimize());
    document.getElementById('btn-close').addEventListener('click', () => window.winControls.close());
  } else {
    winControls.style.display = 'none';
  }

  // ---------- 日/夜主题切换 ----------
  document.getElementById('btn-theme').addEventListener('click', () => {
    const root = document.documentElement;
    root.classList.toggle('light');
    localStorage.setItem('sticky.theme', root.classList.contains('light') ? 'light' : 'dark');
  });

  // ---------- 锁定/解锁窗口 ----------
  document.getElementById('btn-lock').addEventListener('click', () => {
    const root = document.documentElement;
    root.classList.toggle('locked');
    localStorage.setItem('sticky.locked', root.classList.contains('locked') ? '1' : '0');
  });

  render();
  inputEl.focus();
})();
