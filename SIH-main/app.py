import sqlite3
from flask import Flask, render_template, request, redirect, url_for, session, flash
import requests
import yfinance as yf
from datetime import datetime, timedelta
import json

app = Flask(__name__)
app.secret_key = 'a-very-secret-key-that-you-should-change'

# Initialize database for portfolio tracking
def init_portfolio_db():
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    # Create users portfolio table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS user_portfolio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            cash_balance REAL DEFAULT 100000.0,
            total_portfolio_value REAL DEFAULT 100000.0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create stock holdings table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS stock_holdings (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            stock_symbol TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            avg_price REAL NOT NULL,
            purchase_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Create transactions table
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_email TEXT NOT NULL,
            stock_symbol TEXT NOT NULL,
            transaction_type TEXT NOT NULL,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            fees REAL DEFAULT 20.0,
            transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()

# Initialize portfolio for new users
def init_user_portfolio(user_email):
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    # Check if user already has a portfolio
    cursor.execute('SELECT * FROM user_portfolio WHERE user_email = ?', (user_email,))
    if not cursor.fetchone():
        cursor.execute('''
            INSERT INTO user_portfolio (user_email, cash_balance, total_portfolio_value)
            VALUES (?, 100000.0, 100000.0)
        ''', (user_email,))
        conn.commit()
    
    conn.close()

# Popular Indian stocks for the simulator
INDIAN_STOCKS = {
    'RELIANCE.NS': 'Reliance Industries',
    'TCS.NS': 'Tata Consultancy Services',
    'HDFCBANK.NS': 'HDFC Bank',
    'INFY.NS': 'Infosys',
    'HINDUNILVR.NS': 'Hindustan Unilever',
    'ICICIBANK.NS': 'ICICI Bank',
    'KOTAKBANK.NS': 'Kotak Mahindra Bank',
    'BHARTIARTL.NS': 'Bharti Airtel',
    'ITC.NS': 'ITC Limited',
    'SBIN.NS': 'State Bank of India',
    'BAJFINANCE.NS': 'Bajaj Finance',
    'ASIANPAINT.NS': 'Asian Paints',
    'MARUTI.NS': 'Maruti Suzuki',
    'TITAN.NS': 'Titan Company',
    'WIPRO.NS': 'Wipro'
}

BLUE_CHIP_STOCKS = ['RELIANCE.NS', 'TCS.NS', 'HDFCBANK.NS', 'INFY.NS', 'HINDUNILVR.NS']

# Dummy data for kid users as requested
KID_USERS = {
    'kid6@example.com': {'password': 'password6', 'age': 6, 'name': 'Rohan'},
    'kid11@example.com': {'password': 'password11', 'age': 11, 'name': 'Tanya'},
    'kid16@example.com': {'password': 'password16', 'age': 16, 'name': 'Arjun'}
}

# --- Main Routes ---

@app.route('/')
def index():
    """Serves the main home page."""
    return render_template('index.html')

@app.route('/login-choice')
def login_choice():
    """Serves the new page to choose between Parent and Student login."""
    return render_template('choice.html')

@app.route('/parent-login', methods=['GET', 'POST'])
def parent_login():
    """Handles the parent login logic."""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')

        # Dummy credentials as requested
        if email == 'parent@example.com' and password == 'password':
            session['logged_in'] = True
            session['user_type'] = 'parent'
            return redirect(url_for('parent_dashboard'))
        else:
            flash('Invalid credentials. Please try again.')
            return redirect(url_for('parent_login'))

    return render_template('parent_login.html')

@app.route('/parent-dashboard')
def parent_dashboard():
    """Shows the parent dashboard if the user is logged in."""
    if not session.get('logged_in') or session.get('user_type') != 'parent':
        flash('Please log in as a parent to view the dashboard.')
        return redirect(url_for('parent_login'))
    return render_template('parent_dashboard.html')

@app.route('/kid-login', methods=['GET', 'POST'])
def kid_login():
    """Handles the student login with dummy credentials and redirects based on age."""
    if request.method == 'POST':
        email = request.form.get('email')
        password = request.form.get('password')
        
        user = KID_USERS.get(email)
        
        if user and user['password'] == password:
            session['logged_in'] = True
            session['user_type'] = 'kid'
            session['user_info'] = user
            
            age = user['age']
            if age <= 9:
                return redirect(url_for('chillar_party'))
            elif age <= 14:
                return redirect(url_for('smart_spenders'))
            else:
                return redirect(url_for('wealth_builders'))
        else:
            flash('Invalid credentials. Please try again.')
            return redirect(url_for('kid_login'))
            
    return render_template('kid_login.html')

# --- Age-Specific App Routes ---
@app.route('/chillar-party')
def chillar_party():
    """Serves the 'Chillar Party' page for kids aged 4-9."""
    if session.get('user_type') != 'kid':
        return redirect(url_for('kid_login'))
    return render_template('chillar_party.html', user=session.get('user_info'))

@app.route('/smart-spenders')
def smart_spenders():
    """Serves the 'Smart Spenders' page for kids aged 10-14."""
    if session.get('user_type') != 'kid':
        return redirect(url_for('kid_login'))
    return render_template('smart_spenders.html', user=session.get('user_info'))

@app.route('/wealth-builders')
def wealth_builders():
    """Serves the 'Wealth Builders' page for teens aged 15-18."""
    if session.get('user_type') != 'kid':
        return redirect(url_for('kid_login'))
    
    # Initialize portfolio for the user
    user_email = session.get('user_info', {}).get('email', 'kid16@example.com')
    init_user_portfolio(user_email)
    
    return render_template('wealth_builders.html', user=session.get('user_info'))

# --- Stock Trading Simulator Routes ---

@app.route('/api/stock-data/<symbol>')
def get_stock_data(symbol):
    """Fetch real-time stock data using yfinance"""
    try:
        stock = yf.Ticker(symbol)
        
        # Get current price
        info = stock.info
        current_price = info.get('currentPrice', info.get('regularMarketPrice', 0))
        
        # Get 7-day historical data
        hist = stock.history(period='7d')
        
        # Calculate price change
        if len(hist) >= 2:
            prev_close = hist['Close'].iloc[-2]
            price_change = current_price - prev_close
            price_change_percent = (price_change / prev_close) * 100
        else:
            price_change = 0
            price_change_percent = 0
        
        # Prepare chart data
        chart_data = {
            'dates': [date.strftime('%Y-%m-%d') for date in hist.index],
            'prices': hist['Close'].tolist()
        }
        
        return {
            'symbol': symbol,
            'name': INDIAN_STOCKS.get(symbol, symbol),
            'current_price': round(current_price, 2),
            'price_change': round(price_change, 2),
            'price_change_percent': round(price_change_percent, 2),
            'chart_data': chart_data,
            'is_blue_chip': symbol in BLUE_CHIP_STOCKS
        }
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/portfolio')
def get_portfolio():
    """Get user's portfolio data"""
    if session.get('user_type') != 'kid':
        return {'error': 'Unauthorized'}, 401
    
    user_email = session.get('user_info', {}).get('email', 'kid16@example.com')
    
    conn = sqlite3.connect('portfolio.db')
    cursor = conn.cursor()
    
    # Get cash balance
    cursor.execute('SELECT cash_balance FROM user_portfolio WHERE user_email = ?', (user_email,))
    result = cursor.fetchone()
    cash_balance = result[0] if result else 100000.0
    
    # Get stock holdings
    cursor.execute('''
        SELECT stock_symbol, SUM(quantity) as total_quantity, AVG(avg_price) as avg_price
        FROM stock_holdings 
        WHERE user_email = ? 
        GROUP BY stock_symbol
        HAVING total_quantity > 0
    ''', (user_email,))
    
    holdings = []
    total_holdings_value = 0
    
    for row in cursor.fetchall():
        symbol, quantity, avg_price = row
        try:
            # Get current price
            stock = yf.Ticker(symbol)
            current_price = stock.info.get('currentPrice', stock.info.get('regularMarketPrice', avg_price))
            
            current_value = quantity * current_price
            total_holdings_value += current_value
            
            holdings.append({
                'symbol': symbol,
                'name': INDIAN_STOCKS.get(symbol, symbol),
                'quantity': quantity,
                'avg_price': round(avg_price, 2),
                'current_price': round(current_price, 2),
                'current_value': round(current_value, 2),
                'profit_loss': round(current_value - (quantity * avg_price), 2)
            })
        except:
            # Fallback to average price if API fails
            current_value = quantity * avg_price
            total_holdings_value += current_value
            
            holdings.append({
                'symbol': symbol,
                'name': INDIAN_STOCKS.get(symbol, symbol),
                'quantity': quantity,
                'avg_price': round(avg_price, 2),
                'current_price': round(avg_price, 2),
                'current_value': round(current_value, 2),
                'profit_loss': 0
            })
    
    conn.close()
    
    return {
        'cash_balance': round(cash_balance, 2),
        'holdings': holdings,
        'total_portfolio_value': round(cash_balance + total_holdings_value, 2),
        'total_holdings_value': round(total_holdings_value, 2)
    }

@app.route('/api/buy-stock', methods=['POST'])
def buy_stock():
    """Buy stock functionality"""
    if session.get('user_type') != 'kid':
        return {'error': 'Unauthorized'}, 401
    
    data = request.get_json()
    symbol = data.get('symbol')
    quantity = int(data.get('quantity', 0))
    
    if not symbol or quantity <= 0:
        return {'error': 'Invalid symbol or quantity'}, 400
    
    user_email = session.get('user_info', {}).get('email', 'kid16@example.com')
    
    try:
        # Get current stock price
        stock = yf.Ticker(symbol)
        current_price = stock.info.get('currentPrice', stock.info.get('regularMarketPrice', 0))
        
        if current_price <= 0:
            return {'error': 'Unable to fetch stock price'}, 500
        
        total_cost = (quantity * current_price) + 20  # Including ₹20 transaction fee
        
        conn = sqlite3.connect('portfolio.db')
        cursor = conn.cursor()
        
        # Check if user has enough cash
        cursor.execute('SELECT cash_balance FROM user_portfolio WHERE user_email = ?', (user_email,))
        result = cursor.fetchone()
        cash_balance = result[0] if result else 100000.0
        
        if cash_balance < total_cost:
            conn.close()
            return {'error': 'Insufficient funds'}, 400
        
        # Update cash balance
        new_balance = cash_balance - total_cost
        cursor.execute('UPDATE user_portfolio SET cash_balance = ? WHERE user_email = ?', 
                      (new_balance, user_email))
        
        # Add to holdings
        cursor.execute('''
            INSERT INTO stock_holdings (user_email, stock_symbol, quantity, avg_price)
            VALUES (?, ?, ?, ?)
        ''', (user_email, symbol, quantity, current_price))
        
        # Record transaction
        cursor.execute('''
            INSERT INTO transactions (user_email, stock_symbol, transaction_type, quantity, price, fees)
            VALUES (?, ?, 'BUY', ?, ?, 20.0)
        ''', (user_email, symbol, quantity, current_price))
        
        conn.commit()
        conn.close()
        
        return {'success': True, 'message': f'Successfully bought {quantity} shares of {symbol}'}
        
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/sell-stock', methods=['POST'])
def sell_stock():
    """Sell stock functionality"""
    if session.get('user_type') != 'kid':
        return {'error': 'Unauthorized'}, 401
    
    data = request.get_json()
    symbol = data.get('symbol')
    quantity = int(data.get('quantity', 0))
    
    if not symbol or quantity <= 0:
        return {'error': 'Invalid symbol or quantity'}, 400
    
    user_email = session.get('user_info', {}).get('email', 'kid16@example.com')
    
    try:
        conn = sqlite3.connect('portfolio.db')
        cursor = conn.cursor()
        
        # Check if user has enough shares
        cursor.execute('''
            SELECT SUM(quantity) FROM stock_holdings 
            WHERE user_email = ? AND stock_symbol = ?
        ''', (user_email, symbol))
        
        result = cursor.fetchone()
        owned_quantity = result[0] if result and result[0] else 0
        
        if owned_quantity < quantity:
            conn.close()
            return {'error': 'Insufficient shares to sell'}, 400
        
        # Get current stock price
        stock = yf.Ticker(symbol)
        current_price = stock.info.get('currentPrice', stock.info.get('regularMarketPrice', 0))
        
        if current_price <= 0:
            conn.close()
            return {'error': 'Unable to fetch stock price'}, 500
        
        total_value = (quantity * current_price) - 20  # Minus ₹20 transaction fee
        
        # Update cash balance
        cursor.execute('SELECT cash_balance FROM user_portfolio WHERE user_email = ?', (user_email,))
        cash_balance = cursor.fetchone()[0]
        new_balance = cash_balance + total_value
        
        cursor.execute('UPDATE user_portfolio SET cash_balance = ? WHERE user_email = ?', 
                      (new_balance, user_email))
        
        # Remove from holdings (FIFO basis)
        remaining_to_sell = quantity
        cursor.execute('''
            SELECT id, quantity FROM stock_holdings 
            WHERE user_email = ? AND stock_symbol = ? AND quantity > 0
            ORDER BY purchase_date ASC
        ''', (user_email, symbol))
        
        holdings = cursor.fetchall()
        for holding_id, holding_quantity in holdings:
            if remaining_to_sell <= 0:
                break
                
            if holding_quantity <= remaining_to_sell:
                # Remove entire holding
                cursor.execute('DELETE FROM stock_holdings WHERE id = ?', (holding_id,))
                remaining_to_sell -= holding_quantity
            else:
                # Partial removal
                new_quantity = holding_quantity - remaining_to_sell
                cursor.execute('UPDATE stock_holdings SET quantity = ? WHERE id = ?', 
                              (new_quantity, holding_id))
                remaining_to_sell = 0
        
        # Record transaction
        cursor.execute('''
            INSERT INTO transactions (user_email, stock_symbol, transaction_type, quantity, price, fees)
            VALUES (?, ?, 'SELL', ?, ?, 20.0)
        ''', (user_email, symbol, quantity, current_price))
        
        conn.commit()
        conn.close()
        
        return {'success': True, 'message': f'Successfully sold {quantity} shares of {symbol}'}
        
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/ai-insights/<symbol>')
def get_ai_insights(symbol):
    """Get AI-powered insights for a stock"""
    try:
        stock = yf.Ticker(symbol)
        info = stock.info
        
        # Get 24-hour price change
        hist = stock.history(period='2d')
        if len(hist) >= 2:
            current_price = hist['Close'].iloc[-1]
            prev_price = hist['Close'].iloc[-2]
            price_change_percent = ((current_price - prev_price) / prev_price) * 100
        else:
            price_change_percent = 0
        
        insights = []
        
        # Volatility insight
        if abs(price_change_percent) > 5:
            insights.append({
                'type': 'volatility',
                'message': f"🎢 Gullak Guru says: This stock is showing high volatility with a {abs(price_change_percent):.1f}% change! High-risk, high-reward territory.",
                'icon': '⚡'
            })
        elif abs(price_change_percent) > 2:
            insights.append({
                'type': 'moderate',
                'message': f"📊 Gullak Guru says: Moderate price movement of {abs(price_change_percent):.1f}%. Keep an eye on market trends!",
                'icon': '📈'
            })
        else:
            insights.append({
                'type': 'stable',
                'message': "🛡️ Gullak Guru says: This stock is showing stable price movement today. Good for steady investors!",
                'icon': '🔒'
            })
        
        # Blue chip insight
        if symbol in BLUE_CHIP_STOCKS:
            insights.append({
                'type': 'blue_chip',
                'message': "🏆 Gullak Guru says: This is a well-established blue-chip company, often considered a more stable, long-term investment choice.",
                'icon': '💎'
            })
        
        # Market cap insight
        market_cap = info.get('marketCap', 0)
        if market_cap > 1000000000000:  # 1 trillion
            insights.append({
                'type': 'large_cap',
                'message': "🏢 Gullak Guru says: This is a large-cap stock with strong market presence. Generally less risky but slower growth.",
                'icon': '🏗️'
            })
        
        return {'insights': insights}
        
    except Exception as e:
        return {'error': str(e)}, 500

@app.route('/api/available-stocks')
def get_available_stocks():
    """Get list of available stocks for trading"""
    return {'stocks': INDIAN_STOCKS}

# --- Placeholder routes from your original files for completeness ---

@app.route('/parent-register')
def parent_register():
    return render_template('parent_register.html')

@app.route('/kids-app')
def kids_app():
    return render_template('kids_app.html')

@app.route('/logout')
def logout():
    """Logs the user out."""
    session.clear()
    flash('You have been logged out.')
    return redirect(url_for('index'))

if __name__ == '__main__':
    init_portfolio_db()
    app.run(debug=True)