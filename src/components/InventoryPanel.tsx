import { WEAPON_BY_ID } from '../data/weapons';
import { useGameStore } from '../store/gameStore';

export function InventoryPanel() {
  const panel = useGameStore((s) => s.panel);
  const close = useGameStore((s) => s.closePanel);
  const weaponId = useGameStore((s) => s.weaponId);
  const inventory = useGameStore((s) => s.inventory);
  const equipped = WEAPON_BY_ID[weaponId];
  if (panel !== 'inventory') return null;

  return (
    <div className="overlay-backdrop" role="dialog" aria-modal="true" aria-label="Inventory">
      <section className="panel inventory-panel">
        <header><div><h2>Leigneron · Gear</h2><p>Your weapon and carried equipment</p></div><button type="button" onClick={close}>Close</button></header>
        <div className="gear-grid">
          <article>
            <h3>Equipped weapon</h3>
            <strong>{equipped?.name ?? weaponId}</strong>
            <p>{equipped?.description}</p>
            {equipped && <dl><div><dt>Damage</dt><dd>{equipped.damage}</dd></div><div><dt>Reach</dt><dd>{(equipped.reach / 32).toFixed(1)} paces</dd></div><div><dt>Tier</dt><dd>{equipped.tier}</dd></div><div><dt>Recovery</dt><dd>{(equipped.cooldownMs / 1000).toFixed(2)}s</dd></div><div><dt>Stamina</dt><dd>{equipped.staminaCost}</dd></div></dl>}
          </article>
          <article>
            <h3>Inventory</h3>
            <ul>{inventory.map((id) => <li key={id}>{WEAPON_BY_ID[id]?.name ?? id}</li>)}</ul>
          </article>
        </div>
      </section>
    </div>
  );
}
