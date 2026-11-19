import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Calendar, Plus } from 'lucide-react';
import { TaskCategory, TaskPriority } from '../types/productivity';
import { getOffsetDateISO, getTodayISO } from '../data/seedData';

interface TaskComposerProps {
  onAddTask: (task: {
    title: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
  }) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const CATEGORIES: TaskCategory[] = ['Work', 'Personal', 'Health'];
const PRIORITIES: TaskPriority[] = ['High', 'Medium', 'Low'];

export const TaskComposer: React.FC<TaskComposerProps> = ({ onAddTask, inputRef }) => {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Work');
  const [priority, setPriority] = useState<TaskPriority>('Medium');
  const [dueDate, setDueDate] = useState<string>(getTodayISO());
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const todayISO = getTodayISO();
  const tomorrowISO = getOffsetDateISO(1);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = title.trim();
    if (!trimmed) {
      setErrorMsg('Enter a task title before adding.');
      inputRef.current?.focus();
      return;
    }

    onAddTask({
      title: trimmed,
      category,
      priority,
      dueDate: dueDate || todayISO,
    });

    setTitle('');
    setErrorMsg(null);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-800/80 bg-slate-900/65 p-4 backdrop-blur-md transition-colors focus-within:border-indigo-500/60"
    >
      <div className="flex flex-col gap-3">
        {/* Main Input Row */}
        <div className="flex items-center gap-3">
          <input
            ref={inputRef}
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (errorMsg) setErrorMsg(null);
            }}
            placeholder="Add a new daily task... (Press Enter to save)"
            aria-label="Task title"
            className="w-full bg-transparent text-sm text-slate-100 placeholder-slate-500 focus:outline-none"
          />

          <motion.button
            whileTap={{ scale: 0.96 }}
            type="submit"
            className="inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-medium text-white shadow-sm transition-colors hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-500 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Task</span>
          </motion.button>
        </div>

        {errorMsg && (
          <p role="alert" className="text-xs text-rose-400">
            {errorMsg}
          </p>
        )}

        {/* Controls Bar: Category, Priority, Due Date */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-800/70 pt-3 text-xs">
          <div className="flex flex-wrap items-center gap-4">
            {/* Category Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Category:</span>
              <div
                role="group"
                aria-label="Select task category"
                className="flex items-center gap-1 rounded-lg bg-slate-950/70 p-0.5 border border-slate-800/80"
              >
                {CATEGORIES.map((cat) => {
                  const active = category === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCategory(cat)}
                      className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? 'bg-indigo-600/90 text-white'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Priority Selector */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">Priority:</span>
              <div
                role="group"
                aria-label="Select task priority"
                className="flex items-center gap-1 rounded-lg bg-slate-950/70 p-0.5 border border-slate-800/80"
              >
                {PRIORITIES.map((prio) => {
                  const active = priority === prio;
                  const activeStyle =
                    prio === 'High'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : prio === 'Medium'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-slate-800 text-slate-200 border border-slate-700';

                  return (
                    <button
                      key={prio}
                      type="button"
                      onClick={() => setPriority(prio)}
                      className={`whitespace-nowrap shrink-0 rounded-md px-2.5 py-1 text-xs font-medium transition-colors cursor-pointer ${
                        active
                          ? activeStyle
                          : 'text-slate-400 hover:text-slate-200 border border-transparent'
                      }`}
                    >
                      {prio}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Due Date Selector */}
          <div className="flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5 text-slate-400" />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setDueDate(todayISO)}
                className={`whitespace-nowrap shrink-0 rounded-md px-2 py-1 text-xs transition-colors cursor-pointer ${
                  dueDate === todayISO
                    ? 'bg-slate-800 text-emerald-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => setDueDate(tomorrowISO)}
                className={`whitespace-nowrap shrink-0 rounded-md px-2 py-1 text-xs transition-colors cursor-pointer ${
                  dueDate === tomorrowISO
                    ? 'bg-slate-800 text-indigo-400 font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Tomorrow
              </button>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                aria-label="Custom due date"
                className="rounded-md border border-slate-800 bg-slate-950/80 px-2 py-1 font-mono text-xs tabular-nums text-slate-300 focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
