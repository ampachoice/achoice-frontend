import { NIGERIA_LGAS } from '../../data/nigeriaLgas';

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue',
  'Borno', 'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT',
  'Gombe', 'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi',
  'Kwara', 'Lagos', 'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo',
  'Plateau', 'Rivers', 'Sokoto', 'Taraba', 'Yobe', 'Zamfara',
];

// Shared field set for both "add new address" (Profile tab, Checkout
// inline form) and "edit address" — label defaults to "Home" server-side
// if omitted, state is the only other required field beyond full_address.
export default function AddressFormFields({ form, onChange, styles, rowClassName = '' }) {
  const set = (key) => (e) => onChange({ ...form, [key]: e.target.value });

  return (
    <>
      <div className={rowClassName} style={styles.row2}>
        <div style={styles.field}>
          <label style={styles.label}>Label</label>
          <input
            style={styles.input}
            type="text"
            value={form.label}
            onChange={set('label')}
            placeholder="Home, Office, etc."
            maxLength={30}
          />
        </div>
        <div style={styles.field}>
          <label style={styles.label}>
            Phone{' '}
            <span style={{ color: '#aaa', fontWeight: 400 }}>
              (delivery contact, optional)
            </span>
          </label>
          <input
            style={styles.input}
            type="tel"
            value={form.phone}
            onChange={set('phone')}
            placeholder="e.g. 08012345678"
            maxLength={11}
          />
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Full Address *</label>
        <input
          style={styles.input}
          type="text"
          value={form.full_address}
          onChange={set('full_address')}
          placeholder="House number, street name, landmark..."
          required
        />
      </div>

      <div className={rowClassName} style={styles.row2}>
        <div style={styles.field}>
          <label style={styles.label}>State *</label>
          <select style={styles.input} value={form.state} onChange={set('state')} required>
            <option value="">Select state</option>
            {NIGERIAN_STATES.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
        <div style={styles.field}>
          <label style={styles.label}>LGA</label>
          <select
            style={styles.input}
            value={form.lga}
            onChange={set('lga')}
            disabled={!form.state}
          >
            <option value="">{form.state ? 'Select LGA' : 'Select state first'}</option>
            {(NIGERIA_LGAS[form.state] || []).map((lga) => (
              <option key={lga} value={lga}>{lga}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
}

export const emptyAddressForm = () => ({
  label: '',
  full_address: '',
  state: '',
  lga: '',
  phone: '',
});
