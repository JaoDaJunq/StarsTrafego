import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://wpfjxiwffzhjpgbyjovd.supabase.co';
const SUPABASE_KEY = 'sb_publishable_nn4x4vMJ7cFA7gcOytuPwA_Md_TgqaK';

function uid() {
  if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
  return 'p-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export class Room {
  constructor() {
    this.client = createClient(SUPABASE_URL, SUPABASE_KEY);
    this.channel = null;
    this.myId = uid();
    this.myName = 'Jogador';
    this.mySlot = 0;
    this.myBrawlerId = 'joao';
    this.joinedAt = Date.now();

    this.onPeerState = null;
    this.onPeerFire = null;
    this.onWorldEvent = null;
    this.onCombatEvent = null;
    this.onRosterChange = null;
    this.onStatus = null;
  }

  join(pin, name, brawlerId = 'joao') {
    this.myName = (name || 'Jogador').slice(0, 18);
    this.myBrawlerId = brawlerId || 'joao';
    const channelName = 'brawl-adapt-room-' + String(pin).trim();

    this.channel = this.client.channel(channelName, {
      config: {
        presence: { key: this.myId },
        broadcast: { self: false, ack: false }
      }
    });

    this.channel.on('broadcast', { event: 'state' }, ({ payload }) => {
      if (payload.id === this.myId) return;
      this.onPeerState && this.onPeerState(payload);
    });

    this.channel.on('broadcast', { event: 'fire' }, ({ payload }) => {
      if (payload.id === this.myId) return;
      this.onPeerFire && this.onPeerFire(payload);
    });

    this.channel.on('broadcast', { event: 'world' }, ({ payload }) => {
      if (payload.id === this.myId) return;
      this.onWorldEvent && this.onWorldEvent(payload);
    });

    this.channel.on('broadcast', { event: 'combat' }, ({ payload }) => {
      if (payload.id === this.myId) return;
      this.onCombatEvent && this.onCombatEvent(payload);
    });

    this.channel.on('presence', { event: 'sync' }, () => {
      this._reconcileRoster();
    });

    return new Promise((resolve, reject) => {
      let settled = false;
      const timeout = setTimeout(() => {
        if (!settled) {
          settled = true;
          reject(new Error('timeout'));
        }
      }, 12000);

      this.channel.subscribe(async status => {
        this.onStatus && this.onStatus(status);
        if (status === 'SUBSCRIBED') {
          await this.channel.track({
            name: this.myName,
            brawlerId: this.myBrawlerId,
            joinedAt: this.joinedAt
          });
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            resolve();
          }
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
          if (!settled) {
            settled = true;
            clearTimeout(timeout);
            reject(new Error(status));
          }
        }
      });
    });
  }

  _reconcileRoster() {
    const state = this.channel.presenceState();
    const entries = [];
    for (const key of Object.keys(state)) {
      const presences = state[key];
      if (!presences || !presences.length) continue;
      const p = presences[0];
      entries.push({ id: key, name: p.name || 'Jogador', brawlerId: p.brawlerId || 'joao', joinedAt: p.joinedAt || 0 });
    }
    entries.sort((a, b) => a.joinedAt - b.joinedAt || a.id.localeCompare(b.id));
    entries.forEach((e, i) => {
      e.slot = i;
      if (e.id === this.myId) this.mySlot = i;
    });
    this.onRosterChange && this.onRosterChange(entries, this.myId);
  }

  sendState(state) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'state',
      payload: { id: this.myId, ...state }
    });
  }

  sendFire(data) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'fire',
      payload: { id: this.myId, ...data }
    });
  }

  sendWorld(data) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'world',
      payload: { id: this.myId, ...data }
    });
  }

  sendCombat(data) {
    if (!this.channel) return;
    this.channel.send({
      type: 'broadcast',
      event: 'combat',
      payload: { id: this.myId, ...data }
    });
  }

  leave() {
    if (this.channel) {
      this.client.removeChannel(this.channel);
      this.channel = null;
    }
  }
}

export function randomPin() {
  return String(Math.floor(1000 + Math.random() * 9000));
}
