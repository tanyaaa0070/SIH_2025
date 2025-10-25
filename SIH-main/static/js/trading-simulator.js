// Trading Simulator JavaScript
class TradingSimulator {
    constructor() {
        this.currentStock = null;
        this.portfolio = null;
        this.availableStocks = {};
        this.chart = null;
        
        this.init();
    }
    
    async init() {
        await this.loadAvailableStocks();
        await this.loadPortfolio();
        this.setupEventListeners();
        this.renderStockList();
        this.renderPortfolio();
    }
    
    async loadAvailableStocks() {
        try {
            const response = await fetch('/api/available-stocks');
            const data = await response.json();
            this.availableStocks = data.stocks;
        } catch (error) {
            console.error('Error loading stocks:', error);
            this.showNotification('Error loading stock data', 'error');
        }
    }
    
    async loadPortfolio() {
        try {
            const response = await fetch('/api/portfolio');
            const data = await response.json();
            this.portfolio = data;
        } catch (error) {
            console.error('Error loading portfolio:', error);
            this.showNotification('Error loading portfolio', 'error');
        }
    }
    
    async loadStockData(symbol) {
        try {
            const response = await fetch(`/api/stock-data/${symbol}`);
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            this.currentStock = data;
            this.renderStockDetails();
            this.renderChart();
            await this.loadAIInsights(symbol);
            
        } catch (error) {
            console.error('Error loading stock data:', error);
            this.showNotification('Error loading stock data', 'error');
        }
    }
    
    async loadAIInsights(symbol) {
        try {
            const response = await fetch(`/api/ai-insights/${symbol}`);
            const data = await response.json();
            
            if (data.insights) {
                this.renderAIInsights(data.insights);
            }
        } catch (error) {
            console.error('Error loading AI insights:', error);
        }
    }
    
    setupEventListeners() {
        // Buy button
        document.getElementById('buy-btn').addEventListener('click', () => {
            this.showTradeModal('buy');
        });
        
        // Sell button
        document.getElementById('sell-btn').addEventListener('click', () => {
            this.showTradeModal('sell');
        });
        
        // Trade modal buttons
        document.getElementById('confirm-trade').addEventListener('click', () => {
            this.executeTrade();
        });
        
        document.getElementById('cancel-trade').addEventListener('click', () => {
            this.hideTradeModal();
        });
        
        // Close modal when clicking outside
        document.getElementById('trade-modal').addEventListener('click', (e) => {
            if (e.target.id === 'trade-modal') {
                this.hideTradeModal();
            }
        });
        
        // Quantity input validation
        document.getElementById('trade-quantity').addEventListener('input', (e) => {
            const quantity = parseInt(e.target.value) || 0;
            this.updateTradePreview(quantity);
        });
    }
    
    renderStockList() {
        const stockList = document.getElementById('stock-list');
        stockList.innerHTML = '';
        
        Object.entries(this.availableStocks).forEach(([symbol, name]) => {
            const stockItem = document.createElement('div');
            stockItem.className = 'stock-item';
            stockItem.innerHTML = `
                <div class="stock-info">
                    <div class="stock-symbol">${symbol.replace('.NS', '')}</div>
                    <div class="stock-name">${name}</div>
                </div>
                <div class="stock-action">
                    <button class="btn-select" onclick="tradingSimulator.loadStockData('${symbol}')">
                        Select
                    </button>
                </div>
            `;
            stockList.appendChild(stockItem);
        });
    }
    
    renderPortfolio() {
        if (!this.portfolio) return;
        
        // Update portfolio summary
        document.getElementById('cash-balance').textContent = `₹${this.portfolio.cash_balance.toLocaleString()}`;
        document.getElementById('total-value').textContent = `₹${this.portfolio.total_portfolio_value.toLocaleString()}`;
        document.getElementById('holdings-value').textContent = `₹${this.portfolio.total_holdings_value.toLocaleString()}`;
        
        // Update holdings list
        const holdingsList = document.getElementById('holdings-list');
        holdingsList.innerHTML = '';
        
        if (this.portfolio.holdings.length === 0) {
            holdingsList.innerHTML = '<div class="no-holdings">No stocks in portfolio</div>';
            return;
        }
        
        this.portfolio.holdings.forEach(holding => {
            const holdingItem = document.createElement('div');
            holdingItem.className = 'holding-item';
            
            const profitLossClass = holding.profit_loss >= 0 ? 'profit' : 'loss';
            const profitLossSign = holding.profit_loss >= 0 ? '+' : '';
            
            holdingItem.innerHTML = `
                <div class="holding-info">
                    <div class="holding-symbol">${holding.symbol.replace('.NS', '')}</div>
                    <div class="holding-name">${holding.name}</div>
                    <div class="holding-quantity">${holding.quantity} shares</div>
                </div>
                <div class="holding-values">
                    <div class="current-price">₹${holding.current_price}</div>
                    <div class="current-value">₹${holding.current_value.toLocaleString()}</div>
                    <div class="profit-loss ${profitLossClass}">
                        ${profitLossSign}₹${Math.abs(holding.profit_loss).toLocaleString()}
                    </div>
                </div>
            `;
            holdingsList.appendChild(holdingItem);
        });
    }
    
    renderStockDetails() {
        if (!this.currentStock) return;
        
        const stockDetails = document.getElementById('stock-details');
        const changeClass = this.currentStock.price_change >= 0 ? 'positive' : 'negative';
        const changeSign = this.currentStock.price_change >= 0 ? '+' : '';
        
        stockDetails.innerHTML = `
            <div class="stock-header">
                <h3>${this.currentStock.name}</h3>
                <div class="stock-symbol">${this.currentStock.symbol.replace('.NS', '')}</div>
            </div>
            <div class="stock-price">
                <div class="current-price">₹${this.currentStock.current_price}</div>
                <div class="price-change ${changeClass}">
                    ${changeSign}₹${this.currentStock.price_change} (${changeSign}${this.currentStock.price_change_percent.toFixed(2)}%)
                </div>
            </div>
            <div class="stock-actions">
                <button id="buy-btn" class="btn-trade btn-buy">Buy</button>
                <button id="sell-btn" class="btn-trade btn-sell">Sell</button>
            </div>
        `;
        
        // Re-attach event listeners for new buttons
        document.getElementById('buy-btn').addEventListener('click', () => {
            this.showTradeModal('buy');
        });
        
        document.getElementById('sell-btn').addEventListener('click', () => {
            this.showTradeModal('sell');
        });
    }
    
    renderChart() {
        if (!this.currentStock || !this.currentStock.chart_data) return;
        
        const ctx = document.getElementById('stock-chart').getContext('2d');
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: this.currentStock.chart_data.dates,
                datasets: [{
                    label: 'Price',
                    data: this.currentStock.chart_data.prices,
                    borderColor: '#6e3bff',
                    backgroundColor: 'rgba(110, 59, 255, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b0b7c9'
                        }
                    },
                    y: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                        },
                        ticks: {
                            color: '#b0b7c9',
                            callback: function(value) {
                                return '₹' + value.toFixed(2);
                            }
                        }
                    }
                }
            }
        });
    }
    
    renderAIInsights(insights) {
        const insightsContainer = document.getElementById('ai-insights');
        insightsContainer.innerHTML = '';
        
        insights.forEach(insight => {
            const insightItem = document.createElement('div');
            insightItem.className = `ai-insight ${insight.type}`;
            insightItem.innerHTML = `
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-message">${insight.message}</div>
            `;
            insightsContainer.appendChild(insightItem);
        });
    }
    
    showTradeModal(type) {
        if (!this.currentStock) return;
        
        const modal = document.getElementById('trade-modal');
        const title = document.getElementById('trade-title');
        const button = document.getElementById('confirm-trade');
        
        title.textContent = type === 'buy' ? 'Buy Stock' : 'Sell Stock';
        button.textContent = type === 'buy' ? 'Buy' : 'Sell';
        button.className = `btn-trade ${type === 'buy' ? 'btn-buy' : 'btn-sell'}`;
        
        document.getElementById('trade-stock-name').textContent = this.currentStock.name;
        document.getElementById('trade-stock-price').textContent = `₹${this.currentStock.current_price}`;
        document.getElementById('trade-quantity').value = '1';
        document.getElementById('trade-type').value = type;
        
        this.updateTradePreview(1);
        modal.style.display = 'flex';
    }
    
    hideTradeModal() {
        document.getElementById('trade-modal').style.display = 'none';
    }
    
    updateTradePreview(quantity) {
        if (!this.currentStock) return;
        
        const type = document.getElementById('trade-type').value;
        const price = this.currentStock.current_price;
        const fees = 20;
        const total = (quantity * price) + (type === 'buy' ? fees : -fees);
        
        document.getElementById('trade-total').textContent = `₹${total.toLocaleString()}`;
        document.getElementById('trade-fees').textContent = `₹${fees}`;
        
        // Check if user can afford the trade
        const confirmButton = document.getElementById('confirm-trade');
        if (type === 'buy' && this.portfolio && total > this.portfolio.cash_balance) {
            confirmButton.disabled = true;
            confirmButton.textContent = 'Insufficient Funds';
        } else if (type === 'sell') {
            const holding = this.portfolio.holdings.find(h => h.symbol === this.currentStock.symbol);
            if (!holding || holding.quantity < quantity) {
                confirmButton.disabled = true;
                confirmButton.textContent = 'Insufficient Shares';
            } else {
                confirmButton.disabled = false;
                confirmButton.textContent = 'Sell';
            }
        } else {
            confirmButton.disabled = false;
            confirmButton.textContent = type === 'buy' ? 'Buy' : 'Sell';
        }
    }
    
    async executeTrade() {
        const type = document.getElementById('trade-type').value;
        const quantity = parseInt(document.getElementById('trade-quantity').value);
        
        if (!this.currentStock || !quantity || quantity <= 0) {
            this.showNotification('Invalid trade parameters', 'error');
            return;
        }
        
        try {
            const endpoint = type === 'buy' ? '/api/buy-stock' : '/api/sell-stock';
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    symbol: this.currentStock.symbol,
                    quantity: quantity
                })
            });
            
            const data = await response.json();
            
            if (data.success) {
                this.showNotification(data.message, 'success');
                await this.loadPortfolio();
                this.renderPortfolio();
                this.hideTradeModal();
            } else {
                this.showNotification(data.error || 'Trade failed', 'error');
            }
            
        } catch (error) {
            console.error('Trade error:', error);
            this.showNotification('Trade execution failed', 'error');
        }
    }
    
    showNotification(message, type = 'info') {
        // Use the existing notification system from the main page
        const notification = document.getElementById('notification');
        const notificationText = notification.querySelector('.notification-text');
        const notificationIcon = notification.querySelector('.notification-icon i');
        
        notificationText.textContent = message;
        
        // Update icon based on type
        if (type === 'success') {
            notificationIcon.className = 'fas fa-check-circle';
        } else if (type === 'error') {
            notificationIcon.className = 'fas fa-exclamation-circle';
        } else {
            notificationIcon.className = 'fas fa-info-circle';
        }
        
        notification.classList.add('show');
        setTimeout(() => {
            notification.classList.remove('show');
        }, 4000);
    }
}

// Initialize the trading simulator when the page loads
let tradingSimulator;
document.addEventListener('DOMContentLoaded', function() {
    // Only initialize if we're on the wealth builders page and the simulator elements exist
    if (document.getElementById('trading-simulator')) {
        tradingSimulator = new TradingSimulator();
    }
});