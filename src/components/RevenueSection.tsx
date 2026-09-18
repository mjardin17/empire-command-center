import React, { useState } from 'react';
import {
  ArrowUpRight,
  Calendar,
  CheckCircle2,
  DollarSign,
  Edit3,
  HelpCircle,
  Plus,
  TrendingDown,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import {
  addRevenueLog,
  getRevenueChannels,
  getRevenueLogs,
  updateChannelRevenue,
} from '../services/api';
import { ChannelId, CHANNELS, MonthlyRevenueChannel, RevenueLogEntry } from '../types';

export const RevenueSection: React.FC = () => {
  const [channels, setChannels] = useState<MonthlyRevenueChannel[]>(() => getRevenueChannels());
  const [logs, setLogs] = useState<RevenueLogEntry[]>(() => getRevenueLogs());

  // Edit Revenue Modal state
  const [editingChannel, setEditingChannel] = useState<MonthlyRevenueChannel | null>(null);
  const [manualInputVal, setManualInputVal] = useState<string>('');

  // Add Log Entry Modal state
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logChannelId, setLogChannelId] = useState<ChannelId>('little_olympus');
  const [logAmount, setLogAmount] = useState<string>('');
  const [logSource, setLogSource] = useState<string>('YouTube AdSense');
  const [logNotes, setLogNotes] = useState<string>('');

  // Calendar pace calculation
  const today = new Date().getDate();
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = new Date().toLocaleString('en-US', { month: 'long' });

  const totalTarget = channels.reduce((acc, c) => acc + c.monthlyTarget, 0);
  const totalCurrent = channels.reduce((acc, c) => acc + c.currentRevenue, 0);
  const totalPercentage = Math.round((totalCurrent / totalTarget) * 100);
  const totalDailyPace = totalCurrent / Math.max(1, today);
  const totalProjected = Math.round(totalDailyPace * daysInMonth);

  const handleOpenEdit = (c: MonthlyRevenueChannel) => {
    setEditingChannel(c);
    setManualInputVal(c.currentRevenue.toString());
  };

  const handleSaveManualRevenue = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChannel) return;
    const val = parseFloat(manualInputVal) || 0;
    const updated = updateChannelRevenue(editingChannel.channelId, val);
    setChannels(updated);
    setEditingChannel(null);
  };

  const handleSaveLog = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(logAmount);
    if (isNaN(amount) || amount <= 0) return;

    const result = addRevenueLog({
      channelId: logChannelId,
      amount,
      source: logSource,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      notes: logNotes || undefined,
    });

    setLogs(result.logs);
    setChannels(result.channels);
    setShowLogModal(false);
    setLogAmount('');
    setLogNotes('');
  };

  return (
    <section id="revenue-section" className="space-y-5">
      {/* Header and Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="p-2 rounded-xl bg-amber-500/15 text-amber-400 border border-amber-500/25">
            <DollarSign className="w-5 h-5" />
          </span>
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              Monthly Revenue vs Targets
              <span className="text-xs font-mono font-normal px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                {monthName} {year}
              </span>
            </h2>
            <p className="text-xs text-zinc-400">
              Manual actuals entry • Day {today} of {daysInMonth} ({Math.round((today / daysInMonth) * 100)}% through month)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            id="btn-log-revenue"
            onClick={() => setShowLogModal(true)}
            className="min-h-[40px] px-3.5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950 flex items-center gap-1.5 shadow-md shadow-amber-500/20 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Log Payment / AdSense</span>
          </button>
        </div>
      </div>

      {/* Portfolio Overall Summary Card */}
      <div className="p-5 rounded-2xl bg-zinc-900/95 border border-zinc-800 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Total Empire Monthly Target
            </span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl sm:text-3xl font-black text-amber-400 font-mono">
                ${totalCurrent.toLocaleString()}
              </span>
              <span className="text-sm font-bold text-zinc-400 font-mono">
                / ${totalTarget.toLocaleString()}
              </span>
              <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                {totalPercentage}% achieved
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">Daily Factory Pace</span>
              <span className="text-zinc-200 font-bold text-sm">
                ${Math.round(totalDailyPace).toLocaleString()} / day
              </span>
            </div>
            <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-zinc-500 block text-[10px] uppercase">Projected Month-End</span>
              <span
                className={`font-bold text-sm ${
                  totalProjected >= totalTarget ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                ${totalProjected.toLocaleString()} ({Math.round((totalProjected / totalTarget) * 100)}%)
              </span>
            </div>
          </div>
        </div>

        {/* Big Overall Progress Bar */}
        <div className="space-y-1.5">
          <div className="w-full h-3.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-0.5">
            <div
              className="h-full bg-gradient-to-r from-amber-600 via-amber-400 to-emerald-400 rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, Math.max(totalCurrent > 0 ? 2 : 0, totalPercentage))}%` }}
            />
          </div>
          {totalCurrent === 0 && (
            <p className="text-[11px] text-zinc-500 italic">
              No revenue logged yet this cycle. Empty states remain honest—click &ldquo;Log Payment / AdSense&rdquo; above to record verified payouts.
            </p>
          )}
        </div>
      </div>

      {/* 3 Channel Target Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {channels.map((c) => {
          const meta = CHANNELS[c.channelId];
          const pct = Math.round((c.currentRevenue / c.monthlyTarget) * 100);
          const dailyPace = c.currentRevenue / Math.max(1, today);
          const projected = Math.round(dailyPace * daysInMonth);
          const isPacingAhead = projected >= c.monthlyTarget;
          const diffFromTarget = projected - c.monthlyTarget;

          return (
            <div
              key={c.channelId}
              id={`revenue-card-${c.channelId}`}
              className="bg-zinc-900/90 border border-zinc-800/90 hover:border-zinc-700 rounded-2xl p-5 shadow-lg flex flex-col justify-between gap-4 transition-all"
            >
              {/* Card Header */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{meta.emoji}</span>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">{meta.name}</h3>
                    <span className="text-[11px] text-zinc-500 font-mono">
                      Target: ${c.monthlyTarget.toLocaleString()}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(c)}
                  className="min-h-[36px] px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-400 hover:text-amber-300 hover:bg-zinc-800 border border-zinc-800 transition-colors flex items-center gap-1 cursor-pointer"
                  title="Manual Entry"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Update</span>
                </button>
              </div>

              {/* Revenue & Percentage */}
              <div className="space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xl font-black text-zinc-100 font-mono">
                    ${c.currentRevenue.toLocaleString()}
                  </span>
                  <span className="text-xs font-bold font-mono text-amber-400">
                    {pct}% of ${Math.round(c.monthlyTarget / 1000)}k
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
                  <div
                    className={`h-full transition-all duration-500 rounded-full ${
                      pct >= 100
                        ? 'bg-emerald-400'
                        : pct >= 60
                        ? 'bg-amber-400'
                        : 'bg-zinc-400'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  />
                </div>
              </div>

              {/* Month-End Projection at Current Pace */}
              <div className="p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500">Projected Month-End:</span>
                  <span
                    className={`font-mono font-bold ${
                      isPacingAhead ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    ${projected.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-zinc-500">Pace Status:</span>
                  <span
                    className={`inline-flex items-center gap-1 font-semibold ${
                      isPacingAhead ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {isPacingAhead ? (
                      <>
                        <TrendingUp className="w-3 h-3" />
                        <span>Exceeding target (+${diffFromTarget.toLocaleString()})</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="w-3 h-3" />
                        <span>Pacing behind (-${Math.abs(diffFromTarget).toLocaleString()})</span>
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Entry Modal */}
      {editingChannel && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-400" />
                Update Month-to-Date Revenue
              </h3>
              <span className="text-xs text-zinc-400">{editingChannel.name}</span>
            </div>

            <form onSubmit={handleSaveManualRevenue} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-zinc-400 block">
                  Current Month Actuals (USD)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    value={manualInputVal}
                    onChange={(e) => setManualInputVal(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-sm focus:outline-none focus:border-amber-400"
                    autoFocus
                  />
                </div>
                <span className="text-[11px] text-zinc-500">
                  Target: ${editingChannel.monthlyTarget.toLocaleString()} / mo
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingChannel(null)}
                  className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950"
                >
                  Save Actuals
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Log Payment Modal */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Log Channel Revenue Transaction
              </h3>
              <span className="text-xs text-zinc-500">Manual Entry</span>
            </div>

            <form onSubmit={handleSaveLog} className="space-y-3.5">
              <div>
                <label className="text-xs text-zinc-400 block mb-1">Target Channel</label>
                <select
                  value={logChannelId}
                  onChange={(e) => setLogChannelId(e.target.value as ChannelId)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="little_olympus">🏛️ Little Olympus ($50K Target)</option>
                  <option value="iron_legends">🤖 Iron Legends ($35K Target)</option>
                  <option value="empire_decoded">📜 Empire Decoded ($80K Target)</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Amount (USD)</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 font-mono">
                    $
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="e.g. 4500"
                    value={logAmount}
                    onChange={(e) => setLogAmount(e.target.value)}
                    className="w-full pl-8 pr-3 py-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 font-mono text-sm focus:outline-none focus:border-amber-400"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Revenue Source</label>
                <select
                  value={logSource}
                  onChange={(e) => setLogSource(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                >
                  <option value="YouTube AdSense (Direct)">YouTube AdSense (Direct)</option>
                  <option value="Brand Deal / Integrated Sponsor">Brand Deal / Integrated Sponsor</option>
                  <option value="Merchandise & Licensing">Merchandise & Licensing</option>
                  <option value="Membership & SuperThanks">Membership & SuperThanks</option>
                  <option value="Syndication Rights">Syndication Rights</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 block mb-1">Notes / Invoice Ref (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Q3 mid-roll contract payout"
                  value={logNotes}
                  onChange={(e) => setLogNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-zinc-950 border border-zinc-700 text-zinc-100 text-xs focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="min-h-[40px] px-4 py-2 rounded-xl text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-zinc-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[40px] px-5 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-zinc-950"
                >
                  Add Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
};
