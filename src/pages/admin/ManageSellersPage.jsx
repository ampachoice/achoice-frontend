import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

const LOGO_PATH = "/achoice logo.png";
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const lgaData = {
  'Abia': ['Aba North','Aba South','Arochukwu','Bende','Ikwuano','Isiala Ngwa North','Isiala Ngwa South','Isuikwuato','Obi Ngwa','Ohafia','Osisioma','Ugwunagbo','Ukwa East','Ukwa West','Umuahia North','Umuahia South','Umu Nneochi'],
  'Adamawa': ['Demsa','Fufure','Ganye','Gayuk','Gombi','Grie','Hong','Jada','Lamurde','Madagali','Maiha','Mayo Belwa','Michika','Mubi North','Mubi South','Numan','Shelleng','Song','Toungo','Yola North','Yola South'],
  'Akwa Ibom': ['Abak','Eastern Obolo','Eket','Esit Eket','Essien Udim','Etim Ekpo','Etinan','Ibeno','Ibesikpo Asutan','Ibiono Ibom','Ika','Ikono','Ikot Abasi','Ikot Ekpene','Ini','Itu','Mbo','Mkpat Enin','Nsit Atai','Nsit Ibom','Nsit Ubium','Obot Akara','Okobo','Onna','Oron','Oruk Anam','Udung Uko','Ukanafun','Uruan','Urue Offong Oruko','Uyo'],
  'Anambra': ['Aguata','Anambra East','Anambra West','Anaocha','Awka North','Awka South','Ayamelum','Dunukofia','Ekwusigo','Idemili North','Idemili South','Ihiala','Njikoka','Nnewi North','Nnewi South','Ogbaru','Onitsha North','Onitsha South','Orumba North','Orumba South','Oyi'],
  'Bauchi': ['Alkaleri','Bauchi','Bogoro','Damban','Darazo','Dass','Gamawa','Ganjuwa','Giade','Itas Gadau','Jamaare','Katagum','Kirfi','Misau','Ningi','Shira','Tafawa Balewa','Toro','Warji','Zaki'],
  'Bayelsa': ['Brass','Ekeremor','Kolokuma Opokuma','Nembe','Ogbia','Sagbama','Southern Ijaw','Yenagoa'],
  'Benue': ['Ado','Agatu','Apa','Buruku','Gboko','Guma','Gwer East','Gwer West','Katsina Ala','Konshisha','Kwande','Logo','Makurdi','Obi','Ogbadibo','Ohimini','Oju','Okpokwu','Otukpo','Tarka','Ukum','Ushongo','Vandeikya'],
  'Borno': ['Abadam','Askira Uba','Bama','Bayo','Biu','Chibok','Damboa','Dikwa','Gubio','Guzamala','Gwoza','Hawul','Jere','Kaga','Kala Balge','Konduga','Kukawa','Kwaya Kusar','Mafa','Magumeri','Maiduguri','Marte','Mobbar','Monguno','Ngala','Nganzai','Shani'],
  'Cross River': ['Abi','Akamkpa','Akpabuyo','Bakassi','Bekwarra','Biase','Boki','Calabar Municipal','Calabar South','Etung','Ikom','Obanliku','Obubra','Obudu','Odukpani','Ogoja','Yakurr','Yala'],
  'Delta': ['Aniocha North','Aniocha South','Bomadi','Burutu','Ethiope East','Ethiope West','Ika North East','Ika South','Isoko North','Isoko South','Ndokwa East','Ndokwa West','Okpe','Oshimili North','Oshimili South','Patani','Sapele','Udu','Ughelli North','Ughelli South','Ukwuani','Uvwie','Warri North','Warri South','Warri South West'],
  'Ebonyi': ['Abakaliki','Afikpo North','Afikpo South','Ebonyi','Ezza North','Ezza South','Ikwo','Ishielu','Ivo','Izzi','Ohaozara','Ohaukwu','Onicha'],
  'Edo': ['Akoko Edo','Egor','Esan Central','Esan North East','Esan South East','Esan West','Etsako Central','Etsako East','Etsako West','Igueben','Ikpoba Okha','Oredo','Orhionmwon','Ovia North East','Ovia South West','Owan East','Owan West','Uhunmwonde'],
  'Ekiti': ['Ado Ekiti','Efon','Ekiti East','Ekiti South West','Ekiti West','Emure','Gbonyin','Ido Osi','Ijero','Ikere','Ikole','Ilejemeje','Irepodun Ifelodun','Ise Orun','Moba','Oye'],
  'Enugu': ['Aninri','Awgu','Enugu East','Enugu North','Enugu South','Ezeagu','Igbo Etiti','Igbo Eze North','Igbo Eze South','Isi Uzo','Nkanu East','Nkanu West','Nsukka','Oji River','Udenu','Udi','Uzo Uwani'],
  'FCT': ['Abaji','Bwari','Gwagwalada','Kuje','Kwali','Municipal Area Council'],
  'Gombe': ['Akko','Balanga','Billiri','Dukku','Funakaye','Gombe','Kaltungo','Kwami','Nafada','Shongom','Yamaltu Deba'],
  'Imo': ['Aboh Mbaise','Ahiazu Mbaise','Ehime Mbano','Ezinihitte','Ideato North','Ideato South','Ihitte Uboma','Ikeduru','Isiala Mbano','Isu','Mbaitoli','Ngor Okpala','Njaba','Nkwerre','Nwangele','Obowo','Oguta','Ohaji Egbema','Okigwe','Orlu','Orsu','Oru East','Oru West','Owerri Municipal','Owerri North','Owerri West','Unuimo'],
  'Jigawa': ['Auyo','Babura','Biriniwa','Birnin Kudu','Buji','Dutse','Gagarawa','Garki','Gumel','Guri','Gwaram','Gwiwa','Hadejia','Jahun','Kafin Hausa','Kaugama','Kazaure','Kiri Kasama','Kiyawa','Maigatari','Malam Madori','Miga','Ringim','Roni','Sule Tankarkar','Taura','Yankwashi'],
  'Kaduna': ['Birnin Gwari','Chikun','Giwa','Igabi','Ikara','Jaba','Jemaa','Kachia','Kaduna North','Kaduna South','Kagarko','Kajuru','Kaura','Kauru','Kubau','Kudan','Lere','Makarfi','Sabon Gari','Sanga','Soba','Zangon Kataf','Zaria'],
  'Kano': ['Ajingi','Albasu','Bagwai','Bebeji','Bichi','Bunkure','Dala','Dambatta','Dawakin Kudu','Dawakin Tofa','Doguwa','Fagge','Gabasawa','Garko','Garun Mallam','Gaya','Gezawa','Gwale','Gwarzo','Kabo','Kano Municipal','Karaye','Kibiya','Kiru','Kumbotso','Kunchi','Kura','Madobi','Makoda','Minjibir','Nasarawa','Rano','Rimin Gado','Rogo','Shanono','Sumaila','Takai','Tarauni','Tofa','Tsanyawa','Tudun Wada','Ungogo','Warawa','Wudil'],
  'Katsina': ['Bakori','Batagarawa','Batsari','Baure','Bindawa','Charanchi','Dandume','Danja','Dan Musa','Daura','Dutsi','Dutsin Ma','Faskari','Funtua','Ingawa','Jibia','Kafur','Kaita','Kankara','Kankia','Katsina','Kurfi','Kusada','MaiAdua','Malumfashi','Mani','Mashi','Matazu','Musawa','Rimi','Sabuwa','Safana','Sandamu','Zango'],
  'Kebbi': ['Aleiro','Arewa Dandi','Argungu','Augie','Bagudo','Birnin Kebbi','Bunza','Dandi','Fakai','Gwandu','Jega','Kalgo','Koko Besse','Maiyama','Ngaski','Sakaba','Shanga','Suru','Wasagu Danko','Yauri','Zuru'],
  'Kogi': ['Adavi','Ajaokuta','Ankpa','Bassa','Dekina','Ibaji','Idah','Igalamela Odolu','Ijumu','Kabba Bunu','Kogi','Lokoja','Mopa Muro','Ofu','Ogori Magongo','Okehi','Okene','Olamaboro','Omala','Yagba East','Yagba West'],
  'Kwara': ['Asa','Baruten','Edu','Ekiti','Ifelodun','Ilorin East','Ilorin South','Ilorin West','Irepodun','Isin','Kaiama','Moro','Offa','Oke Ero','Oyun','Pategi'],
  'Lagos': ['Agege','Ajeromi Ifelodun','Alimosho','Amuwo Odofin','Apapa','Badagry','Epe','Eti Osa','Ibeju Lekki','Ifako Ijaiye','Ikeja','Ikorodu','Kosofe','Lagos Island','Lagos Mainland','Mushin','Ojo','Oshodi Isolo','Shomolu','Surulere'],
  'Nasarawa': ['Akwanga','Awe','Doma','Karu','Keana','Keffi','Kokona','Lafia','Nasarawa','Nasarawa Egon','Obi','Toto','Wamba'],
  'Niger': ['Agaie','Agwara','Bida','Borgu','Bosso','Chanchaga','Edati','Gbako','Gurara','Katcha','Kontagora','Lapai','Lavun','Magama','Mariga','Mashegu','Mokwa','Moya','Paikoro','Rafi','Rijau','Shiroro','Suleja','Tafa','Wushishi'],
  'Ogun': ['Abeokuta North','Abeokuta South','Ado Odo Ota','Ewekoro','Ifo','Ijebu East','Ijebu North','Ijebu North East','Ijebu Ode','Ikenne','Imeko Afon','Ipokia','Obafemi Owode','Odeda','Odogbolu','Ogun Waterside','Remo North','Shagamu'],
  'Ondo': ['Akoko North East','Akoko North West','Akoko South East','Akoko South West','Akure North','Akure South','Ese Odo','Idanre','Ifedore','Ilaje','Ile Oluji Okeigbo','Irele','Odigbo','Okitipupa','Ondo East','Ondo West','Ose','Owo'],
  'Osun': ['Aiyedade','Aiyedire','Atakumosa East','Atakumosa West','Boluwaduro','Boripe','Ede North','Ede South','Egbedore','Ejigbo','Ife Central','Ife East','Ife North','Ife South','Ifedayo','Ifelodun','Ila','Ilesa East','Ilesa West','Irepodun','Irewole','Isokan','Iwo','Obokun','Odo Otin','Ola Oluwa','Olorunda','Oriade','Orolu','Osogbo'],
  'Oyo': ['Afijio','Akinyele','Atiba','Atisbo','Egbeda','Ibadan North','Ibadan North East','Ibadan North West','Ibadan South East','Ibadan South West','Ibarapa Central','Ibarapa East','Ibarapa North','Ido','Irepo','Iseyin','Itesiwaju','Iwajowa','Kajola','Lagelu','Ogbomosho North','Ogbomosho South','Ogo Oluwa','Olorunsogo','Oluyole','Ona Ara','Orelope','Ori Ire','Oyo East','Oyo West','Saki East','Saki West','Surulere'],
  'Plateau': ['Barkin Ladi','Bassa','Bokkos','Jos East','Jos North','Jos South','Kanam','Kanke','Langtang North','Langtang South','Mangu','Mikang','Pankshin','Qua an Pan','Riyom','Shendam','Wase'],
  'Rivers': ['Abua Odual','Ahoada East','Ahoada West','Akuku Toru','Andoni','Asari Toru','Bonny','Degema','Eleme','Emohua','Etche','Gokana','Ikwerre','Khana','Obio Akpor','Ogba Egbema Ndoni','Ogu Bolo','Okrika','Omuma','Opobo Nkoro','Oyigbo','Port Harcourt','Tai'],
  'Sokoto': ['Binji','Bodinga','Dange Shuni','Gada','Goronyo','Gudu','Gwadabawa','Illela','Isa','Kebbe','Kware','Rabah','Sabon Birni','Shagari','Silame','Sokoto North','Sokoto South','Tambuwal','Tangaza','Tureta','Wamako','Wurno','Yabo'],
  'Taraba': ['Ardo Kola','Bali','Donga','Gashaka','Gassol','Ibi','Jalingo','Karim Lamido','Kumi','Lau','Sardauna','Takum','Ussa','Wukari','Yorro','Zing'],
  'Yobe': ['Bade','Bursari','Damaturu','Fika','Fune','Geidam','Gujba','Gulani','Jakusko','Karasuwa','Machina','Nangere','Nguru','Potiskum','Tarmuwa','Yunusari','Yusufari'],
  'Zamfara': ['Anka','Bakura','Birnin Magaji Kiyaw','Bukkuyum','Bungudu','Gummi','Gusau','Kaura Namoda','Maradun','Maru','Shinkafi','Talata Mafara','Tsafe','Zurmi'],
};

const nigerianStates = Object.keys(lgaData).sort();

function MiniBar({ data, color = '#1f4d1f' }) {
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 5, height: 80 }}>
      {data.map((d, i) => (
        <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
          <div style={{ fontSize: 8, color: '#888' }}>{d.value > 0 ? `₦${(d.value/1000).toFixed(0)}k` : ''}</div>
          <div style={{ width: '100%', background: color, borderRadius: '2px 2px 0 0', height: `${Math.max((d.value / max) * 60, d.value > 0 ? 3 : 0)}px`, opacity: 0.8 }} />
          <div style={{ fontSize: 8, color: '#888' }}>{d.label}</div>
        </div>
      ))}
    </div>
  );
}

function getStatusStyle(status) {
  return ({
    active:    { background: '#eafaf0', color: '#1a7a3a' },
    suspended: { background: '#fff0f0', color: '#cc0000' },
    pending:   { background: '#fff8e7', color: '#b36b00' },
  }[status] || { background: '#f0f0f0', color: '#555' });
}

export default function ManageSellersPage() {
  const navigate = useNavigate();
  const [summary, setSummary] = useState(null);
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '',
    business_name: '', state: '', lga: '',
    bank_name: '', account_number: '', account_name: '',
  });
  const [selectedSeller, setSelectedSeller] = useState(null);
  const [sellerStats, setSellerStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(false);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4000); };

  const fetchSellers = () => {
    setLoading(true);
    api.get('/admin/stats/sellers')
      .then(res => {
        const data = res.data;
        setSummary({
          total_sellers: data.total_sellers,
          active_sellers: data.active_sellers,
          total_platform_revenue: data.total_platform_revenue,
          total_pending_remittance: data.total_pending_remittance,
        });
        setSellers(data.sellers || []);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchSellers(); }, []);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
      ...(name === 'state' ? { lga: '' } : {}),
    }));
  };

  const handleAddSeller = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/sellers', formData);
      showToast('Seller added successfully!');
      setShowForm(false);
      setFormData({ name: '', email: '', phone: '', password: '', business_name: '', state: '', lga: '', bank_name: '', account_number: '', account_name: '' });
      fetchSellers();
    } catch (err) {
      const errors = err.response?.data?.errors;
      if (errors) showToast(Object.values(errors)[0][0]);
      else showToast(err.response?.data?.message || 'Failed to add seller.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectSeller = (seller) => {
    setSelectedSeller(seller);
    setSellerStats(null);
    setStatsLoading(true);
    api.get(`/admin/sellers/${seller.id}/stats`)
      .then(res => setSellerStats(res.data))
      .catch(() => showToast('Failed to load seller stats'))
      .finally(() => setStatsLoading(false));
  };

  const handleRemit = async (sellerId) => {
    if (!window.confirm('Confirm remittance for this seller?')) return;
    try {
      const res = await api.patch(`/admin/sellers/${sellerId}/remit`);
      showToast(`Remitted ₦${Number(res.data.amount_remitted).toLocaleString()} to ${res.data.seller}`);
      handleSelectSeller(selectedSeller);
    } catch (err) {
      showToast(err.response?.data?.message || 'Remittance failed');
    }
  };

  const buildChartData = (monthly) => {
    if (!monthly?.length) return [];
    return [...monthly].reverse().map(m => ({
      label: MONTHS[(m.month - 1)],
      value: Number(m.revenue || 0),
    }));
  };

  const filtered = sellers.filter(s =>
    s.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.owner?.toLowerCase().includes(search.toLowerCase())
  );

  const availableLgas = formData.state ? (lgaData[formData.state] || []) : [];

  if (loading) return <div style={s.loader}>Loading Sellers...</div>;

  return (
    <div style={s.page}>
      {toast && <div style={s.toast}>{toast}</div>}

      <div style={s.sidebar}>
        <div style={s.sidebarLogo}>
          <img src={LOGO_PATH} alt="Achoice" style={s.logoImg} />
          <div>
            <div style={s.sidebarLogoName}>ACHOICE</div>
            <div style={s.sidebarLogoSub}>Admin Panel</div>
          </div>
        </div>
        <nav style={s.sidebarNav}>
          {[
            { icon: '📊', label: 'Dashboard', path: '/admin/dashboard' },
            { icon: '🏪', label: 'Sellers', path: '/admin/sellers', active: true },
            { icon: '🌾', label: 'Products', path: '/admin/products' },
            { icon: '📦', label: 'Orders', path: '/admin/orders' },
            { icon: '💰', label: 'Loans', path: '/admin/loans' },
            { icon: '⚙️', label: 'Loan Settings', path: '/admin/loan-settings' },
            { icon: '🚚', label: 'Delivery Zones', path: '/admin/delivery-zones' },
             { icon: '👥', label: 'Staff', path: '/admin/staff'},
          ].map(item => (
            <div key={item.label}
              style={{ ...s.sidebarItem, ...(item.active ? s.sidebarItemActive : {}) }}
              onClick={() => navigate(item.path)}
            >
              <span>{item.icon}</span> {item.label}
            </div>
          ))}
        </nav>
      </div>

      <div style={s.main}>
        <div style={s.header}>
          <div>
            <h1 style={s.headerTitle}>Sellers</h1>
            <p style={s.headerSub}>{sellers.length} registered sellers</p>
          </div>
          <button style={s.addBtn} onClick={() => setShowForm(!showForm)}>
            {showForm ? 'Cancel' : '+ Add Seller'}
          </button>
        </div>

        {showForm && (
          <div style={s.formCard}>
            <h3 style={s.formTitle}>Register New Seller</h3>
            <form onSubmit={handleAddSeller}>
              <div style={s.formGrid}>
                <div style={s.formSection}>
                  <div style={s.formSectionTitle}>Account Details</div>
                  <div style={s.field}>
                    <label style={s.label}>Full Name</label>
                    <input style={s.input} name="name" value={formData.name} onChange={handleFormChange} placeholder="Seller full name" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Email</label>
                    <input style={s.input} type="email" name="email" value={formData.email} onChange={handleFormChange} placeholder="Email address" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Phone</label>
                    <input style={s.input} name="phone" value={formData.phone} onChange={handleFormChange} placeholder="08012345678" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Password</label>
                    <input style={s.input} type="password" name="password" value={formData.password} onChange={handleFormChange} placeholder="Minimum 8 characters" required />
                  </div>
                </div>

                <div style={s.formSection}>
                  <div style={s.formSectionTitle}>Business Details</div>
                  <div style={s.field}>
                    <label style={s.label}>Business Name</label>
                    <input style={s.input} name="business_name" value={formData.business_name} onChange={handleFormChange} placeholder="Business name" required />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>State</label>
                    <select style={s.input} name="state" value={formData.state} onChange={handleFormChange} required>
                      <option value="">Select state</option>
                      {nigerianStates.map(st => <option key={st} value={st}>{st}</option>)}
                    </select>
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>LGA</label>
                    <select style={s.input} name="lga" value={formData.lga} onChange={handleFormChange} required disabled={!formData.state}>
                      <option value="">{formData.state ? 'Select LGA' : 'Select state first'}</option>
                      {availableLgas.map(lg => <option key={lg} value={lg}>{lg}</option>)}
                    </select>
                  </div>
                </div>

                <div style={s.formSection}>
                  <div style={s.formSectionTitle}>Bank Details</div>
                  <div style={s.field}>
                    <label style={s.label}>Bank Name</label>
                    <input style={s.input} name="bank_name" value={formData.bank_name} onChange={handleFormChange} placeholder="e.g. Access Bank" />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Account Number</label>
                    <input style={s.input} name="account_number" value={formData.account_number} onChange={handleFormChange} placeholder="10-digit account number" />
                  </div>
                  <div style={s.field}>
                    <label style={s.label}>Account Name</label>
                    <input style={s.input} name="account_name" value={formData.account_name} onChange={handleFormChange} placeholder="Account holder name" />
                  </div>
                </div>
              </div>
              <button type="submit" style={submitting ? s.submitBtnDisabled : s.submitBtn} disabled={submitting}>
                {submitting ? 'Creating Seller...' : 'Create Seller Account'}
              </button>
            </form>
          </div>
        )}

        {summary && (
          <div style={s.summaryGrid}>
            {[
              { label: 'Total Sellers', value: summary.total_sellers, icon: '🏪', color: '#1f4d1f' },
              { label: 'Active Sellers', value: summary.active_sellers, icon: '✅', color: '#1a7a3a' },
              { label: 'Platform Revenue', value: `₦${Number(summary.total_platform_revenue).toLocaleString()}`, icon: '💵', color: '#c8860a' },
              { label: 'Pending Remittance', value: `₦${Number(summary.total_pending_remittance).toLocaleString()}`, icon: '⏳', color: '#cc0000' },
            ].map(stat => (
              <div key={stat.label} style={s.statCard}>
                <div style={s.statTop}>
                  <div style={s.statLabel}>{stat.label}</div>
                  <div style={s.statIcon}>{stat.icon}</div>
                </div>
                <div style={{ ...s.statValue, color: stat.color }}>{stat.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          <div style={s.tableSection}>
            <input style={s.searchInput} type="text" placeholder="Search sellers..." value={search} onChange={e => setSearch(e.target.value)} />
            <div style={s.tableCard}>
              <table style={s.table}>
                <thead>
                  <tr style={s.tableHead}>
                    <th style={s.th}>Seller</th>
                    <th style={s.th}>State</th>
                    <th style={s.th}>Products</th>
                    <th style={s.th}>Sold</th>
                    <th style={s.th}>Revenue</th>
                    <th style={s.th}>Balance</th>
                    <th style={s.th}>Status</th>
                    <th style={s.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(seller => (
                    <tr key={seller.id} style={{ ...s.tableRow, background: selectedSeller?.id === seller.id ? '#f0f7ec' : '#fff' }}>
                      <td style={s.td}>
                        <div style={s.sellerName}>{seller.business_name}</div>
                        <div style={s.sellerOwner}>{seller.owner}</div>
                      </td>
                      <td style={s.td}>{seller.state}</td>
                      <td style={s.td}>{seller.total_products}</td>
                      <td style={s.td}>{seller.items_sold}</td>
                      <td style={s.td}>₦{Number(seller.total_revenue).toLocaleString()}</td>
                      <td style={s.td}>
                        <span style={{ color: seller.current_balance > 0 ? '#cc0000' : '#888', fontWeight: 600 }}>
                          ₦{Number(seller.current_balance).toLocaleString()}
                        </span>
                      </td>
                      <td style={s.td}>
                        <span style={{ ...s.statusBadge, ...getStatusStyle(seller.status) }}>{seller.status}</span>
                      </td>
                      <td style={s.td}>
                        <button style={s.viewBtn} onClick={() => handleSelectSeller(seller)}>View Stats</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && <div style={s.empty}>No sellers found.</div>}
            </div>
          </div>

          {selectedSeller && (
            <div style={s.statsPanel}>
              <div style={s.statsPanelHeader}>
                <div>
                  <div style={s.statsPanelTitle}>{selectedSeller.business_name}</div>
                  <div style={s.statsPanelSub}>{selectedSeller.owner} · {selectedSeller.state}</div>
                </div>
                <button style={s.closeBtn} onClick={() => { setSelectedSeller(null); setSellerStats(null); }}>✕</button>
              </div>

              {statsLoading ? (
                <div style={s.statsLoading}>Loading stats...</div>
              ) : sellerStats ? (
                <div style={s.statsPanelBody}>
                  <div style={s.miniStatsGrid}>
                    {[
                      { label: 'Total Products', value: sellerStats.overview.total_products },
                      { label: 'Active', value: sellerStats.overview.active_products },
                      { label: 'Out of Stock', value: sellerStats.overview.out_of_stock },
                      { label: 'Items Sold', value: sellerStats.overview.total_items_sold },
                      { label: 'Delivered', value: sellerStats.overview.delivered_items },
                      { label: 'Pending', value: sellerStats.overview.pending_delivery },
                    ].map(item => (
                      <div key={item.label} style={s.miniStat}>
                        <div style={s.miniStatValue}>{item.value}</div>
                        <div style={s.miniStatLabel}>{item.label}</div>
                      </div>
                    ))}
                  </div>

                  <div style={s.earningsBox}>
                    <div style={s.earningsTitle}>Earnings</div>
                    <div style={s.earningsGrid}>
                      <div style={s.earningItem}>
                        <div style={s.earningValue}>₦{Number(sellerStats.earnings.total_revenue).toLocaleString()}</div>
                        <div style={s.earningLabel}>Total Revenue</div>
                      </div>
                      <div style={s.earningItem}>
                        <div style={{ ...s.earningValue, color: '#cc0000' }}>₦{Number(sellerStats.earnings.current_balance).toLocaleString()}</div>
                        <div style={s.earningLabel}>Current Balance</div>
                      </div>
                      <div style={s.earningItem}>
                        <div style={{ ...s.earningValue, color: '#1a7a3a' }}>₦{Number(sellerStats.earnings.total_remitted).toLocaleString()}</div>
                        <div style={s.earningLabel}>Total Remitted</div>
                      </div>
                    </div>
                    {sellerStats.earnings.can_remit && (
                      <button style={s.remitBtn} onClick={() => handleRemit(selectedSeller.id)}>
                        Mark as Remitted — ₦{Number(sellerStats.earnings.current_balance).toLocaleString()}
                      </button>
                    )}
                  </div>

                  <div style={s.bankBox}>
                    <div style={s.sectionTitle}>Bank Details</div>
                    <div style={s.bankGrid}>
                      <div><span style={s.bankLabel}>Bank</span><div style={s.bankValue}>{sellerStats.seller.bank_name || '—'}</div></div>
                      <div><span style={s.bankLabel}>Account</span><div style={s.bankValue}>{sellerStats.seller.account_number || '—'}</div></div>
                      <div><span style={s.bankLabel}>Name</span><div style={s.bankValue}>{sellerStats.seller.account_name || '—'}</div></div>
                    </div>
                  </div>

                  {sellerStats.monthly_revenue?.length > 0 && (
                    <div style={s.chartBox}>
                      <div style={s.sectionTitle}>Monthly Revenue (Last 6 Months)</div>
                      <MiniBar data={buildChartData(sellerStats.monthly_revenue)} color="#1f4d1f" />
                    </div>
                  )}

                  {sellerStats.top_products?.length > 0 && (
                    <div>
                      <div style={s.sectionTitle}>Top Products</div>
                      {sellerStats.top_products.map((p, i) => (
                        <div key={p.id} style={s.topProductRow}>
                          <div style={s.topProductRank}>#{i + 1}</div>
                          <div style={s.topProductInfo}>
                            <div style={s.topProductName}>{p.name}</div>
                            <div style={s.topProductMeta}>{p.items_sold} sold · {p.rating} ({p.reviews} reviews) · Stock: {p.stock}</div>
                          </div>
                          <div style={s.topProductPrice}>₦{Number(p.price).toLocaleString()}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {sellerStats.recent_orders?.length > 0 && (
                    <div>
                      <div style={s.sectionTitle}>Recent Orders</div>
                      {sellerStats.recent_orders.slice(0, 5).map((o, i) => (
                        <div key={i} style={s.recentOrderRow}>
                          <div>
                            <div style={s.recentOrderNum}>{o.order_number}</div>
                            <div style={s.recentOrderMeta}>{o.product} · {o.buyer}</div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={s.recentOrderAmount}>₦{Number(o.subtotal).toLocaleString()}</div>
                            <span style={{ ...s.statusBadge, ...getStatusStyle(o.status), fontSize: 10 }}>{o.status}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const s = {
  page: { display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f5', fontFamily: 'Arial, sans-serif' },
  loader: { textAlign: 'center', padding: 100, fontSize: 18, color: '#1f4d1f', fontWeight: 600 },
  toast: { position: 'fixed', top: 20, right: 20, background: '#1f4d1f', color: '#fff', padding: '14px 28px', borderRadius: 8, zIndex: 9999 },
  sidebar: { width: 240, background: '#1f4d1f', display: 'flex', flexDirection: 'column', position: 'fixed', top: 0, left: 0, height: '100vh' },
  sidebarLogo: { display: 'flex', alignItems: 'center', gap: 10, padding: 20, borderBottom: '1px solid rgba(255,255,255,0.1)' },
  logoImg: { width: 40, height: 40, objectFit: 'contain' },
  sidebarLogoName: { fontSize: 14, fontWeight: 700, color: '#fff' },
  sidebarLogoSub: { fontSize: 10, color: '#a8d5a8' },
  sidebarNav: { flex: 1, padding: '16px 0' },
  sidebarItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', color: '#a8d5a8', fontSize: 14, cursor: 'pointer' },
  sidebarItemActive: { background: 'rgba(255,255,255,0.1)', color: '#fff', borderLeft: '4px solid #f0c050' },
  main: { flex: 1, marginLeft: 240, padding: 32 },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  headerTitle: { fontSize: 24, fontWeight: 700, color: '#111' },
  headerSub: { fontSize: 14, color: '#888', marginTop: 4 },
  addBtn: { background: '#1f4d1f', color: '#fff', border: 'none', padding: '12px 24px', borderRadius: 8, cursor: 'pointer', fontWeight: 600, fontSize: 14, fontFamily: 'inherit' },
  formCard: { background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', padding: 28, marginBottom: 24 },
  formTitle: { fontSize: 16, fontWeight: 700, color: '#1f4d1f', margin: '0 0 20px' },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 24, marginBottom: 20 },
  formSection: { display: 'flex', flexDirection: 'column', gap: 14 },
  formSectionTitle: { fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#444' },
  input: { padding: '10px 12px', border: '1px solid #ddd', borderRadius: 7, fontSize: 13, fontFamily: 'inherit', outline: 'none' },
  submitBtn: { width: '100%', padding: 13, background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit' },
  submitBtnDisabled: { width: '100%', padding: 13, background: '#ccc', color: '#fff', border: 'none', borderRadius: 8, fontSize: 14, cursor: 'not-allowed', fontFamily: 'inherit' },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 24 },
  statCard: { background: '#fff', borderRadius: 10, border: '1px solid #e8e4dc', padding: 18 },
  statTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  statLabel: { fontSize: 12, color: '#888' },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: 700 },
  tableSection: { flex: 1, minWidth: 0 },
  searchInput: { width: '100%', maxWidth: 400, padding: '12px 18px', border: 'none', borderRadius: 10, boxShadow: '0 2px 8px rgba(0,0,0,0.05)', fontSize: 14, marginBottom: 16, boxSizing: 'border-box', fontFamily: 'inherit', outline: 'none' },
  tableCard: { background: '#fff', borderRadius: 12, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  tableHead: { background: '#f8f9fa', borderBottom: '2px solid #eee' },
  th: { padding: '14px 16px', textAlign: 'left', fontSize: 11, color: '#666', textTransform: 'uppercase', letterSpacing: 0.5 },
  tableRow: { transition: '0.15s' },
  td: { padding: '14px 16px', borderBottom: '1px solid #f5f5f5', verticalAlign: 'middle', fontSize: 13 },
  sellerName: { fontWeight: 600, color: '#111' },
  sellerOwner: { fontSize: 11, color: '#888', marginTop: 2 },
  statusBadge: { fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 99, textTransform: 'capitalize' },
  viewBtn: { background: '#f0f7ec', color: '#1f4d1f', border: '1px solid #a8d5a8', padding: '6px 12px', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' },
  empty: { padding: 40, textAlign: 'center', color: '#999' },
  statsPanel: { width: 380, flexShrink: 0, background: '#fff', borderRadius: 12, border: '1px solid #e8e4dc', overflow: 'hidden', position: 'sticky', top: 20, maxHeight: '90vh', display: 'flex', flexDirection: 'column' },
  statsPanelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '20px 20px 16px', background: '#1f4d1f', flexShrink: 0 },
  statsPanelTitle: { fontSize: 15, fontWeight: 700, color: '#fff' },
  statsPanelSub: { fontSize: 12, color: '#a8d5a8', marginTop: 3 },
  closeBtn: { background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' },
  statsLoading: { padding: 40, textAlign: 'center', color: '#888', fontSize: 14 },
  statsPanelBody: { padding: 20, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 },
  miniStatsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 },
  miniStat: { background: '#f7f5f0', borderRadius: 8, padding: '12px 10px', textAlign: 'center' },
  miniStatValue: { fontSize: 20, fontWeight: 700, color: '#1f4d1f' },
  miniStatLabel: { fontSize: 10, color: '#888', marginTop: 3 },
  earningsBox: { background: '#f0fff4', borderRadius: 10, padding: 16, border: '1px solid #c5ddb8' },
  earningsTitle: { fontSize: 13, fontWeight: 700, color: '#1f4d1f', marginBottom: 12 },
  earningsGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginBottom: 12 },
  earningItem: { textAlign: 'center' },
  earningValue: { fontSize: 15, fontWeight: 700, color: '#111' },
  earningLabel: { fontSize: 10, color: '#666', marginTop: 3 },
  remitBtn: { width: '100%', padding: 10, background: '#1f4d1f', color: '#fff', border: 'none', borderRadius: 7, fontWeight: 600, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' },
  bankBox: { background: '#f7f5f0', borderRadius: 10, padding: 14 },
  bankGrid: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 10 },
  bankLabel: { fontSize: 10, color: '#888', textTransform: 'uppercase', letterSpacing: 0.5 },
  bankValue: { fontSize: 12, fontWeight: 600, color: '#111', marginTop: 3 },
  chartBox: {},
  sectionTitle: { fontSize: 13, fontWeight: 700, color: '#333', marginBottom: 10 },
  topProductRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  topProductRank: { fontSize: 11, fontWeight: 700, color: '#c8860a', width: 20 },
  topProductInfo: { flex: 1 },
  topProductName: { fontSize: 12, fontWeight: 600, color: '#111' },
  topProductMeta: { fontSize: 10, color: '#888', marginTop: 2 },
  topProductPrice: { fontSize: 12, fontWeight: 700, color: '#1f4d1f' },
  recentOrderRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #f5f5f5' },
  recentOrderNum: { fontSize: 12, fontWeight: 600, color: '#111' },
  recentOrderMeta: { fontSize: 10, color: '#888', marginTop: 2 },
  recentOrderAmount: { fontSize: 13, fontWeight: 700, color: '#1f4d1f', marginBottom: 4 },
};