import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title } from 'chart.js';
import { Doughnut, Bar } from 'react-chartjs-2';
import './App.css';

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, Title);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
const BASE_URL = API_URL.replace('/api', '');

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  
  // View State: 'landing', 'auth', 'dashboard', 'categories'
  const [view, setView] = useState(token ? 'dashboard' : 'landing');
  
  // Auth State
  const [isLoginView, setIsLoginView] = useState(true);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Transaction Form State
  const [txAmount, setTxAmount] = useState('');
  const [txDescription, setTxDescription] = useState('');
  const [txDate, setTxDate] = useState(new Date().toISOString().split('T')[0]);
  const [txCategory, setTxCategory] = useState(''); 
  const [txCurrency, setTxCurrency] = useState('USD');
  const [txReceipt, setTxReceipt] = useState(null);

  // Category Form State
  const [newCatName, setNewCatName] = useState('');
  const [newCatType, setNewCatType] = useState('expense');

  // Budget Form State
  const [budgets, setBudgets] = useState([]);
  const [budgetAmt, setBudgetAmt] = useState('');
  const [budgetMonthYear, setBudgetMonthYear] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [budgetCat, setBudgetCat] = useState('');

  useEffect(() => {
    if (token) {
      setView('dashboard');
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [txRes, catRes, budgetRes] = await Promise.all([
        axios.get(`${API_URL}/transactions`, { headers }),
        axios.get(`${API_URL}/categories`, { headers }),
        axios.get(`${API_URL}/budgets`, { headers })
      ]);
      setTransactions(txRes.data);
      setCategories(catRes.data);
      setBudgets(budgetRes.data);
      if (catRes.data.length > 0 && !txCategory) {
        setTxCategory(catRes.data[0].id.toString());
      }
      if (catRes.data.length > 0 && !budgetCat) {
        const expCat = catRes.data.find(c => c.type === 'expense');
        if (expCat) setBudgetCat(expCat.id.toString());
      }
    } catch (err) {
      console.error("Fetch failed", err);
      if (err.response?.status === 401) handleLogout();
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const endpoint = isLoginView ? '/auth/login' : '/auth/register';
      const res = await axios.post(`${API_URL}${endpoint}`, {
        email: authEmail,
        password: authPassword
      });
      
      if (isLoginView) {
        setToken(res.data.token);
        localStorage.setItem('token', res.data.token);
        setView('dashboard');
      } else {
        setIsLoginView(true);
        setAuthError('Registration successful! Please log in.');
        setAuthPassword('');
      }
    } catch (err) {
      setAuthError(err.response?.data?.error || 'Authentication failed');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setToken('');
    setTransactions([]);
    setCategories([]);
    setBudgets([]);
    setView('landing');
  };

  const handleAddTransaction = async (e) => {
    e.preventDefault();
    try {
      const formData = new FormData();
      formData.append('amount', parseFloat(txAmount));
      formData.append('description', txDescription);
      formData.append('date', txDate);
      formData.append('categoryId', parseInt(txCategory));
      formData.append('currency', txCurrency);
      if (txReceipt) {
        formData.append('receipt', txReceipt);
      }

      await axios.post(`${API_URL}/transactions`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });
      
      setTxAmount('');
      setTxDescription('');
      setTxReceipt(null);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Failed to add transaction');
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${API_URL}/transactions/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    try {
      await axios.post(`${API_URL}/categories`, {
        name: newCatName,
        type: newCatType
      }, { headers: { Authorization: `Bearer ${token}` } });
      setNewCatName('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to add category');
    }
  };

  const handleDeleteCategory = async (id) => {
    try {
      await axios.delete(`${API_URL}/categories/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete category');
    }
  };

  const handleAddBudget = async (e) => {
    e.preventDefault();
    try {
      const [year, month] = budgetMonthYear.split('-');
      await axios.post(`${API_URL}/budgets`, {
        amount: parseFloat(budgetAmt),
        month: parseInt(month),
        year: parseInt(year),
        categoryId: parseInt(budgetCat)
      }, { headers: { Authorization: `Bearer ${token}` } });
      
      setBudgetAmt('');
      fetchData();
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to set budget');
    }
  };

  // CORRECTED CALCULATION LOGIC: Handles refunds natively without Math.abs adding to expenses
  const totalIncome = transactions
    .filter(t => (t.Category ? t.Category.type === 'income' : t.amount > 0))
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
    
  const totalExpense = transactions
    .filter(t => (t.Category ? t.Category.type === 'expense' : t.amount < 0))
    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);

  const balance = totalIncome - totalExpense;

  // Chart Data preparation
  const expenseCategories = {};
  transactions.forEach(t => {
    if (t.Category && t.Category.type === 'expense') {
      const amt = parseFloat(t.amount);
      if (amt > 0) {
        expenseCategories[t.Category.name] = (expenseCategories[t.Category.name] || 0) + amt;
      }
    }
  });

  const chartData = {
    labels: Object.keys(expenseCategories),
    datasets: [{
      data: Object.values(expenseCategories),
      backgroundColor: [
        'rgba(239, 68, 68, 0.8)',
        'rgba(245, 158, 11, 0.8)',
        'rgba(16, 185, 129, 0.8)',
        'rgba(59, 130, 246, 0.8)',
        'rgba(139, 92, 246, 0.8)'
      ],
      borderWidth: 0
    }]
  };

  // Report Data Preparation
  const monthlyData = {};
  transactions.forEach(t => {
    const dateObj = new Date(t.date);
    const monthYear = dateObj.toLocaleString('default', { month: 'short', year: 'numeric' });
    if (!monthlyData[monthYear]) {
      monthlyData[monthYear] = { income: 0, expense: 0, monthNum: dateObj.getMonth(), yearNum: dateObj.getFullYear() };
    }
    const isIncome = t.Category ? t.Category.type === 'income' : t.amount > 0;
    const amt = parseFloat(t.amount);
    if (isIncome) monthlyData[monthYear].income += amt;
    else monthlyData[monthYear].expense += amt;
  });

  const sortedMonths = Object.keys(monthlyData).sort((a, b) => {
    if (monthlyData[a].yearNum !== monthlyData[b].yearNum) return monthlyData[a].yearNum - monthlyData[b].yearNum;
    return monthlyData[a].monthNum - monthlyData[b].monthNum;
  });

  const barChartData = {
    labels: sortedMonths,
    datasets: [
      {
        label: 'Income',
        data: sortedMonths.map(m => monthlyData[m].income),
        backgroundColor: 'rgba(16, 185, 129, 0.8)',
      },
      {
        label: 'Expense',
        data: sortedMonths.map(m => monthlyData[m].expense),
        backgroundColor: 'rgba(239, 68, 68, 0.8)',
      }
    ]
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: 'white' } },
    },
    scales: {
      y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } },
      x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(255,255,255,0.1)' } }
    }
  };

  if (view === 'landing') {
    return (
      <div className="landing-container">
        <nav className="landing-nav">
          <a href="#" className="landing-logo">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
            Finance<span>Tracker</span>
          </a>
          <div>
            <button className="text-btn" onClick={() => { setView('auth'); setIsLoginView(true); }} style={{marginRight: '1.5rem', fontSize: '1.1rem'}}>Sign In</button>
            <button className="btn" onClick={() => { setView('auth'); setIsLoginView(false); }}>Get Started</button>
          </div>
        </nav>

        <section className="hero-section">
          <h1 className="hero-title">Take Control of Your Wealth.</h1>
          <p className="hero-subtitle">
            Experience the most elegant, powerful, and intuitive way to track your personal finances, completely for free. 
            Designed to help you reach your financial goals faster.
          </p>
          <div className="cta-buttons">
            <button className="btn btn-large" onClick={() => { setView('auth'); setIsLoginView(false); }}>Start Tracking Now</button>
            <button className="btn btn-outline btn-large" onClick={() => { setView('auth'); setIsLoginView(true); }}>Login to Account</button>
          </div>
        </section>

        <section className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">✨</div>
            <h3 className="feature-title">Beautiful & Intuitive</h3>
            <p className="feature-desc">A premium glassmorphism dark-mode UI that makes managing money an absolute pleasure.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3 className="feature-title">Instant Analytics</h3>
            <p className="feature-desc">See your total income, expenses, and current balance instantly updated on your dashboard.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔒</div>
            <h3 className="feature-title">Secure & Private</h3>
            <p className="feature-desc">Industry-standard JWT authentication and encrypted data keeps your financial information secure.</p>
          </div>
        </section>
      </div>
    );
  }

  if (view === 'auth') {
    return (
      <div className="auth-wrapper">
        <button 
          className="text-btn" 
          onClick={() => setView('landing')}
          style={{ position: 'absolute', top: '2rem', left: '2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
        >
          ← Back to Home
        </button>
        <div className="auth-container card">
          <div style={{textAlign: 'center', marginBottom: '2rem'}}>
            <h2 style={{color: 'var(--accent)', fontSize: '2rem'}}>FinanceTracker</h2>
            <p>{isLoginView ? 'Welcome back!' : 'Create your account'}</p>
          </div>
          
          {authError && <div className="error-text">{authError}</div>}
          
          <form onSubmit={handleAuth} className="auth-form">
            <div className="input-group">
              <label>Email Address</label>
              <input 
                type="email" 
                className="input-field" 
                value={authEmail} 
                onChange={e => setAuthEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="input-group">
              <label>Password</label>
              <input 
                type="password" 
                className="input-field" 
                value={authPassword} 
                onChange={e => setAuthPassword(e.target.value)} 
                required 
              />
            </div>
            <button type="submit" className="btn">
              {isLoginView ? 'Sign In' : 'Create Account'}
            </button>
          </form>
          
          <div style={{marginTop: '1.5rem', textAlign: 'center'}}>
            <span style={{color: 'var(--text-secondary)'}}>
              {isLoginView ? "Don't have an account? " : "Already have an account? "}
            </span>
            <button className="text-btn" onClick={() => {
              setIsLoginView(!isLoginView);
              setAuthError('');
            }}>
              {isLoginView ? 'Register here' : 'Sign in'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'categories') {
    return (
      <div className="app-container">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
             <button className="text-btn" onClick={() => setView('dashboard')}>← Dashboard</button>
             <h2 style={{margin: 0, marginLeft: '1rem'}}>Manage Categories</h2>
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Add Category</h3>
            <form onSubmit={handleAddCategory} className="auth-form" style={{marginTop: '1rem'}}>
              <div className="input-group">
                <label>Category Name</label>
                <input type="text" className="input-field" value={newCatName} onChange={e => setNewCatName(e.target.value)} required />
              </div>
              <div className="input-group">
                <label>Type</label>
                <select className="input-field" value={newCatType} onChange={e => setNewCatType(e.target.value)}>
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <button type="submit" className="btn" style={{marginTop: '0.5rem'}}>Save Category</button>
            </form>
          </div>

          <div className="card">
            <h3>Your Categories</h3>
            <div className="transactions-list">
              {categories.map(cat => (
                <div key={cat.id} className="transaction-item">
                  <div>
                    <span className="tx-desc">{cat.name}</span>
                    <span className="tx-category" style={{marginLeft: '10px'}}>{cat.type}</span>
                  </div>
                  <button onClick={() => handleDeleteCategory(cat.id)} className="delete-btn" title="Delete Category">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'reports') {
    return (
      <div className="app-container">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
             <button className="text-btn" onClick={() => setView('dashboard')}>← Dashboard</button>
             <h2 style={{margin: 0, marginLeft: '1rem'}}>Financial Reports</h2>
          </div>
        </header>

        <div className="card" style={{marginBottom: '2rem'}}>
          <h3 style={{marginBottom: '1rem'}}>Monthly Income vs Expenses</h3>
          <div style={{height: '350px', display: 'flex', justifyContent: 'center'}}>
            {sortedMonths.length > 0 ? (
              <Bar data={barChartData} options={barChartOptions} />
            ) : (
              <p style={{alignSelf: 'center'}}>No data available for reports.</p>
            )}
          </div>
        </div>
        
        <div className="card">
          <h3>Monthly Breakdown</h3>
          <div className="transactions-list" style={{marginTop: '1rem'}}>
            <div className="transaction-item" style={{background: 'rgba(255,255,255,0.05)', fontWeight: 'bold'}}>
              <span style={{flex: 1}}>Month</span>
              <span style={{flex: 1, textAlign: 'right', color: 'var(--success)'}}>Income</span>
              <span style={{flex: 1, textAlign: 'right', color: 'var(--danger)'}}>Expense</span>
              <span style={{flex: 1, textAlign: 'right'}}>Net Savings</span>
            </div>
            {sortedMonths.length === 0 && <p style={{textAlign: 'center', marginTop: '1rem'}}>No data</p>}
            {sortedMonths.map(m => {
              const net = monthlyData[m].income - monthlyData[m].expense;
              return (
                <div key={m} className="transaction-item">
                  <span style={{flex: 1}}>{m}</span>
                  <span style={{flex: 1, textAlign: 'right'}}>${monthlyData[m].income.toFixed(2)}</span>
                  <span style={{flex: 1, textAlign: 'right'}}>${monthlyData[m].expense.toFixed(2)}</span>
                  <span style={{flex: 1, textAlign: 'right', color: net >= 0 ? 'var(--success)' : 'var(--danger)'}}>
                    {net >= 0 ? '+' : '-'}${Math.abs(net).toFixed(2)}
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    );
  }

  if (view === 'budgets') {
    // Current month view logic
    const [year, month] = budgetMonthYear.split('-');
    const currentBudgets = budgets.filter(b => b.month === parseInt(month) && b.year === parseInt(year));
    
    return (
      <div className="app-container">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
             <button className="text-btn" onClick={() => setView('dashboard')}>← Dashboard</button>
             <h2 style={{margin: 0, marginLeft: '1rem'}}>Budgets</h2>
          </div>
        </header>

        <div className="dashboard-grid">
          <div className="card">
            <h3>Set Budget</h3>
            <form onSubmit={handleAddBudget} className="auth-form" style={{marginTop: '1rem'}}>
              <div className="input-group">
                <label>Month / Year</label>
                <input 
                  type="month" 
                  className="input-field" 
                  value={budgetMonthYear} 
                  onChange={e => setBudgetMonthYear(e.target.value)} 
                  required 
                />
              </div>
              <div className="input-group">
                <label>Category</label>
                <select className="input-field" value={budgetCat} onChange={e => setBudgetCat(e.target.value)} required>
                  {categories.filter(c => c.type === 'expense').map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Budget Limit ($)</label>
                <input type="number" step="0.01" className="input-field" value={budgetAmt} onChange={e => setBudgetAmt(e.target.value)} required />
              </div>
              <button type="submit" className="btn" style={{marginTop: '0.5rem'}}>Save Budget</button>
            </form>
          </div>

          <div className="card">
            <h3>Budget Tracking ({budgetMonthYear})</h3>
            <div className="transactions-list">
              {currentBudgets.length === 0 ? (
                <p>No budgets set for this month.</p>
              ) : (
                currentBudgets.map(b => {
                  const cat = categories.find(c => c.id === b.categoryId);
                  
                  // Calculate spent
                  const spent = transactions
                    .filter(t => t.categoryId === b.categoryId && new Date(t.date).getMonth() + 1 === b.month && new Date(t.date).getFullYear() === b.year)
                    .reduce((acc, curr) => acc + parseFloat(curr.amount), 0);
                  
                  const limit = parseFloat(b.amount);
                  const progress = Math.min(100, Math.max(0, (spent / limit) * 100));
                  let color = 'var(--success)';
                  if (progress > 50) color = 'var(--accent)';
                  if (progress > 80) color = 'var(--danger)';

                  return (
                    <div key={b.id} className="transaction-item" style={{display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'stretch'}}>
                      <div style={{display: 'flex', justifyContent: 'space-between'}}>
                        <span className="tx-desc">{cat ? cat.name : 'Unknown Category'}</span>
                        <span style={{fontSize: '0.9rem'}}><span style={{color: color}}>${spent.toFixed(2)}</span> / ${limit.toFixed(2)}</span>
                      </div>
                      <div style={{width: '100%', height: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '4px', overflow: 'hidden'}}>
                        <div style={{width: `${progress}%`, height: '100%', background: color, transition: 'width 0.3s'}} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem'}}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
          <h1 style={{margin: 0, fontSize: '2rem'}}>FinanceTracker</h1>
        </div>
        <div style={{display: 'flex', gap: '1rem'}}>
          <button onClick={() => setView('reports')} className="btn btn-outline">Reports</button>
          <button onClick={() => setView('budgets')} className="btn btn-outline">Budgets</button>
          <button onClick={() => setView('categories')} className="btn btn-outline">Manage Categories</button>
          <button onClick={handleLogout} className="btn btn-danger">Logout</button>
        </div>
      </header>

      <div className="dashboard-grid">
        <div className="left-panel">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-title">Balance</div>
              <div className={`stat-value ${balance >= 0 ? 'income' : 'expense'}`}>
                ${balance.toFixed(2)}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Income</div>
              <div className="stat-value income">+${totalIncome.toFixed(2)}</div>
            </div>
            <div className="stat-card">
              <div className="stat-title">Expenses</div>
              <div className="stat-value expense">-${totalExpense.toFixed(2)}</div>
            </div>
          </div>

          <div className="card">
            <h3>Add Transaction</h3>
            <form onSubmit={handleAddTransaction} className="auth-form" style={{marginTop: '1rem'}}>
              <div className="input-group">
                <label>Description</label>
                <input 
                  type="text" 
                  className="input-field"
                  value={txDescription}
                  onChange={e => setTxDescription(e.target.value)}
                  placeholder="e.g. Groceries"
                  required
                />
              </div>
              <div className="input-group">
                <label>Amount (Use negative for refunds)</label>
                <input 
                  type="number" 
                  step="0.01"
                  className="input-field"
                  value={txAmount}
                  onChange={e => setTxAmount(e.target.value)}
                  placeholder="e.g. 1500.00"
                  required
                />
              </div>
              <div className="input-group">
                <label>Date</label>
                <input 
                  type="date" 
                  className="input-field"
                  value={txDate}
                  onChange={e => setTxDate(e.target.value)}
                  required
                />
              </div>
              <div className="input-group">
                <label>Currency</label>
                <select 
                  className="input-field"
                  value={txCurrency}
                  onChange={e => setTxCurrency(e.target.value)}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="INR">INR (₹)</option>
                </select>
              </div>
              <div className="input-group">
                <label>Category</label>
                <select 
                  className="input-field"
                  value={txCategory}
                  onChange={e => setTxCategory(e.target.value)}
                  required
                >
                  {categories.map(cat => (
                     <option key={cat.id} value={cat.id}>{cat.name} ({cat.type})</option>
                  ))}
                </select>
              </div>
              <div className="input-group">
                <label>Receipt (Optional)</label>
                <input 
                  type="file" 
                  className="input-field"
                  accept="image/*,.pdf"
                  onChange={e => setTxReceipt(e.target.files[0])}
                  style={{padding: '0.5rem'}}
                />
              </div>
              <button type="submit" className="btn" style={{marginTop: '0.5rem'}}>Save Transaction</button>
            </form>
          </div>
        </div>

        <div className="right-panel" style={{display: 'flex', flexDirection: 'column', gap: '2rem'}}>
          <div className="card">
            <h3 style={{margin: 0, marginBottom: '1.5rem'}}>Expense Breakdown</h3>
            <div style={{height: '250px', display: 'flex', justifyContent: 'center'}}>
              {Object.keys(expenseCategories).length > 0 ? (
                <Doughnut data={chartData} options={{ maintainAspectRatio: false }} />
              ) : (
                <p style={{alignSelf: 'center'}}>No expenses yet.</p>
              )}
            </div>
          </div>

          <div className="card">
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem'}}>
              <h3 style={{margin: 0}}>Recent Transactions</h3>
            </div>
            
            <div className="transactions-list">
              {transactions.length === 0 ? (
                <p style={{textAlign: 'center', marginTop: '2rem'}}>No transactions yet. Add some to get started!</p>
              ) : (
                transactions.map(tx => {
                  const isIncome = tx.Category ? tx.Category.type === 'income' : tx.amount > 0;
                  
                  // Determine currency symbol
                  const currencySymbols = { USD: '$', EUR: '€', GBP: '£', INR: '₹' };
                  const sym = currencySymbols[tx.currency] || '$';

                  // Handle Refunds logic display
                  // For an expense, positive amount means cash outflow (-$100). Negative amount means refund (+$45).
                  const flowSign = isIncome ? (tx.amount >= 0 ? '+' : '-') : (tx.amount >= 0 ? '-' : '+');
                  const flowClass = isIncome ? (tx.amount >= 0 ? 'income' : 'expense') : (tx.amount >= 0 ? 'expense' : 'income');

                  return (
                    <div key={tx.id} className="transaction-item">
                      <div className="tx-info">
                        <span className="tx-desc">{tx.description}</span>
                        <span className="tx-date">{new Date(tx.date).toLocaleDateString()}</span>
                        <div>
                          {tx.Category && <span className="tx-category">{tx.Category.name}</span>}
                          {tx.receiptUrl && (
                            <a href={`${BASE_URL}${tx.receiptUrl}`} target="_blank" rel="noreferrer" style={{marginLeft: '10px', fontSize: '0.8rem', color: 'var(--accent)'}}>
                              📎 View Receipt
                            </a>
                          )}
                        </div>
                      </div>
                      <div className="tx-right">
                        <span className={`tx-amount ${flowClass}`}>
                          {flowSign}{sym}{Math.abs(tx.amount).toFixed(2)}
                        </span>
                        <button onClick={() => handleDelete(tx.id)} className="delete-btn" title="Delete">
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;