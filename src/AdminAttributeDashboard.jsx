import Header from './Header';
import SidePanel from './SidePanel';

function AdminAttributeDashboard({ onHomeClick, onAttributeMasterClick }) {
  const sideItems = [
    'Dashboard',
    'Attribute Master',
    'Manage Users',
    'Reports',
    'Quizzes',
    'Results',
    'Settings',
  ];
  return (
    <div className="admin-attribute-dashboard-fullpage">
      <Header title="QMS Admin">
        <ul className="navbar-menu" style={{ display: 'flex', listStyle: 'none', marginLeft: 'auto', gap: 28, alignItems: 'center' }}>
          <li className="navbar-menu-item" style={{ cursor: 'pointer' }} onClick={onHomeClick}>Home</li>
          <li className="navbar-menu-item" style={{ cursor: 'pointer', color: '#ffd6d6' }}>Logout</li>
        </ul>
      </Header>
      <div className="admin-attribute-dashboard-body">
        <SidePanel items={sideItems} onItemClick={item => {
          if (item === 'Attribute Master') onAttributeMasterClick();
        }} />
        <main className="admin-attribute-dashboard-main">
          <h2 className="admin-attribute-dashboard-heading">Attribute Dashboard</h2>
          <div className="admin-attribute-dashboard-row">
            <div className="admin-attribute-panel">Attribute Master</div>
            <div className="admin-attribute-panel">Attribute Values</div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminAttributeDashboard;
