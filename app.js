// 在庫管理アプリ（サーバー連携版）

class StockManager {
  constructor() {
    this.items = [];
    this.currentTab = 'all';
    this.editingId = null;
    this.init();
  }

  // サーバーからアイテムを読み込み
  async loadItems() {
    const res = await fetch('/api/items');
    this.items = await res.json();
    this.render();
  }

  // UUIDを生成
  generateId() {
    return 'item-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  // 初期化
  async init() {
    this.bindEvents();
    await this.loadItems();
  }

  // イベントバインド
  bindEvents() {
    // タブ切り替え
    document.querySelectorAll('.tab').forEach(tab => {
      tab.addEventListener('click', (e) => {
        this.switchTab(e.target.dataset.tab);
      });
    });

    // モーダル開閉
    document.getElementById('openModal').addEventListener('click', () => {
      this.openModal();
    });

    document.getElementById('closeModal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('cancelModal').addEventListener('click', () => {
      this.closeModal();
    });

    document.getElementById('modal').addEventListener('click', (e) => {
      if (e.target.id === 'modal') {
        this.closeModal();
      }
    });

    // フォーム送信
    document.getElementById('itemForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveItem();
    });
  }

  // タブ切り替え
  switchTab(tab) {
    this.currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => {
      t.classList.toggle('active', t.dataset.tab === tab);
    });
    this.render();
  }

  // モーダルを開く
  openModal(itemId = null) {
    this.editingId = itemId;
    const modal = document.getElementById('modal');
    const title = document.getElementById('modalTitle');
    const form = document.getElementById('itemForm');

    if (itemId) {
      const item = this.items.find(i => i.id === itemId);
      if (item) {
        title.textContent = 'アイテムを編集';
        document.getElementById('itemId').value = item.id;
        document.getElementById('itemName').value = item.name;
        document.getElementById('itemCategory').value = item.category;
        document.getElementById('itemQuantity').value = item.quantity;
        document.getElementById('itemMinQuantity').value = item.minQuantity;
        document.getElementById('itemUnit').value = item.unit;
      }
    } else {
      title.textContent = 'アイテムを追加';
      form.reset();
      document.getElementById('itemId').value = '';
      document.getElementById('itemQuantity').value = 0;
      document.getElementById('itemMinQuantity').value = 1;
      document.getElementById('itemUnit').value = '個';
    }

    modal.classList.add('active');
  }

  // モーダルを閉じる
  closeModal() {
    document.getElementById('modal').classList.remove('active');
    this.editingId = null;
  }

  // アイテムを保存
  async saveItem() {
    const id = document.getElementById('itemId').value;
    const name = document.getElementById('itemName').value.trim();
    const category = document.getElementById('itemCategory').value;
    const quantity = parseInt(document.getElementById('itemQuantity').value, 10);
    const minQuantity = parseInt(document.getElementById('itemMinQuantity').value, 10);
    const unit = document.getElementById('itemUnit').value.trim() || '個';

    if (!name) return;

    const now = new Date().toISOString();

    if (id) {
      // 更新
      await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, category, quantity, minQuantity, unit, updatedAt: now })
      });
    } else {
      // 新規追加
      await fetch('/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: this.generateId(),
          name,
          category,
          quantity,
          minQuantity,
          unit,
          createdAt: now,
          updatedAt: now
        })
      });
    }

    this.closeModal();
    await this.loadItems();
  }

  // アイテムを削除
  async deleteItem(id) {
    if (confirm('このアイテムを削除しますか？')) {
      await fetch(`/api/items/${id}`, { method: 'DELETE' });
      await this.loadItems();
    }
  }

  // 在庫を増やす
  async increaseQuantity(id) {
    const item = this.items.find(i => i.id === id);
    if (item) {
      const now = new Date().toISOString();
      await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          quantity: item.quantity + 1,
          minQuantity: item.minQuantity,
          unit: item.unit,
          updatedAt: now
        })
      });
      await this.loadItems();
    }
  }

  // 在庫を減らす
  async decreaseQuantity(id) {
    const item = this.items.find(i => i.id === id);
    if (item && item.quantity > 0) {
      const now = new Date().toISOString();
      await fetch(`/api/items/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: item.name,
          category: item.category,
          quantity: item.quantity - 1,
          minQuantity: item.minQuantity,
          unit: item.unit,
          updatedAt: now
        })
      });
      await this.loadItems();
    }
  }

  // 在庫が不足しているか
  isLowStock(item) {
    return item.quantity < item.minQuantity;
  }

  // 表示するアイテムをフィルタ
  getFilteredItems() {
    if (this.currentTab === 'tobuy') {
      return this.items.filter(item => this.isLowStock(item));
    }
    return this.items;
  }

  // カテゴリ別にグループ化
  groupByCategory(items) {
    return {
      refrigerator: items.filter(i => i.category === 'refrigerator'),
      daily: items.filter(i => i.category === 'daily'),
      other: items.filter(i => i.category === 'other')
    };
  }

  // アイテムのHTML生成
  renderItem(item) {
    const isLow = this.isLowStock(item);
    const stockClass = isLow ? 'low-stock' : 'sufficient';
    const textClass = isLow ? 'low' : 'ok';
    const indicator = isLow ? '🔴' : '🟢';

    return `
      <div class="item ${stockClass}" data-id="${item.id}">
        <div class="item-info">
          <div class="item-name">${this.escapeHtml(item.name)}</div>
          <div class="item-stock ${textClass}">
            ${indicator} ${item.quantity}/${item.minQuantity}${this.escapeHtml(item.unit)}
          </div>
        </div>
        <div class="item-actions">
          <button class="item-btn decrease" onclick="app.decreaseQuantity('${item.id}')" title="減らす">−</button>
          <button class="item-btn increase" onclick="app.increaseQuantity('${item.id}')" title="増やす">+</button>
          <button class="item-btn edit" onclick="app.openModal('${item.id}')" title="編集">✏️</button>
          <button class="item-btn delete" onclick="app.deleteItem('${item.id}')" title="削除">🗑️</button>
        </div>
      </div>
    `;
  }

  // HTMLエスケープ
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 画面描画
  render() {
    const filteredItems = this.getFilteredItems();
    const grouped = this.groupByCategory(filteredItems);

    const categories = ['refrigerator', 'daily', 'other'];

    categories.forEach(cat => {
      const container = document.getElementById(`${cat}-items`);
      const section = container.closest('.category');
      const items = grouped[cat];

      if (items.length === 0) {
        container.innerHTML = '';
        section.classList.add('hidden');
      } else {
        container.innerHTML = items.map(item => this.renderItem(item)).join('');
        section.classList.remove('hidden');
      }
    });

    // 全カテゴリが空の場合
    const allEmpty = categories.every(cat => grouped[cat].length === 0);
    const existingEmpty = document.querySelector('.empty-message');

    if (allEmpty) {
      if (!existingEmpty) {
        const message = this.currentTab === 'tobuy'
          ? '買い物リストは空です 🎉'
          : 'アイテムがありません。「+ 追加」から追加してください。';

        const emptyDiv = document.createElement('div');
        emptyDiv.className = 'empty-message';
        emptyDiv.textContent = message;
        document.querySelector('.main').appendChild(emptyDiv);
      }
    } else if (existingEmpty) {
      existingEmpty.remove();
    }
  }
}

// アプリ起動
const app = new StockManager();
