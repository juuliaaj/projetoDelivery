const API_BASE_URL = 'http://localhost:8080/api';

class DeliveryAPI {
  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  async getUsers() {
    return this.request('/users');
  }

  async getUserById(id) {
    return this.request(`/users/${id}`);
  }

  async getRestaurants() {
    return this.request('/restaurants');
  }

  async getRestaurantById(id) {
    return this.request(`/restaurants/${id}`);
  }

  async getFoods() {
    return this.request('/foods');
  }

  async getFoodById(id) {
    return this.request(`/foods/${id}`);
  }

  async getFoodsByRestaurant(restaurantId) {
    return this.request(`/foods/restaurant/${restaurantId}`);
  }

  async getFoodsByCategory(category) {
    return this.request(`/foods/category/${category}`);
  }

  async getOrders() {
    return this.request('/orders');
  }

  async updateOrderStatus(orderId, status) {
    return this.request(`/orders/${orderId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }

  async healthCheck() {
    return this.request('/health');
  }
}

const deliveryAPI = new DeliveryAPI();

function showLoading(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div style="text-align: center; padding: 2rem;">
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #FF4757; border-radius: 50%; width: 40px; height: 40px; animation: spin 2s linear infinite; margin: 0 auto;"></div>
        <p style="margin-top: 1rem; color: #5c5c5c;">Carregando...</p>
      </div>
    `;
  }
}

function showError(elementId, message) {
  const element = document.getElementById(elementId);
  if (element) {
    element.innerHTML = `
      <div style="text-align: center; padding: 2rem; background: #ffe6e6; border-radius: 10px; color: #c22b37;">
        <p><strong>Erro:</strong> ${message}</p>
        <button onclick="location.reload()" style="margin-top: 1rem; background: #FF4757; color: white; border: none; padding: 0.5rem 1rem; border-radius: 5px; cursor: pointer;">Tentar novamente</button>
      </div>
    `;
  }
}

function hideElement(elementId) {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = 'none';
  }
}

function showElement(elementId, displayType = 'block') {
  const element = document.getElementById(elementId);
  if (element) {
    element.style.display = displayType;
  }
}

async function loadFoodsData(limit = 6) {
  const dishesGrid = document.getElementById('dishesGrid');
  
  if (!dishesGrid) return;

  try {
    showLoading('loadingDishes');
    
    const foods = await deliveryAPI.getFoods();
    
    hideElement('loadingDishes');
    
    displayFoods(foods.slice(0, limit));
    showElement('dishesGrid', 'grid');
    
    console.log(`✅ ${foods.length} comidas carregadas da API`);
    
  } catch (error) {
    console.error('Erro ao carregar comidas:', error);
    hideElement('loadingDishes');
    showError('dishesGrid', 'Não foi possível carregar os pratos. Verifique se o servidor está rodando.');
    
    setTimeout(() => {
      if (confirm('Deseja usar dados de demonstração?')) {
        displayMockFoods();
        showElement('dishesGrid', 'grid');
      }
    }, 2000);
  }
}

async function loadRestaurantsData() {
  const restaurantsGrid = document.getElementById('restaurantsGrid');

  if (!restaurantsGrid) return;

  try {
    showLoading('loadingRestaurants');

    const restaurants = await deliveryAPI.getRestaurants();

    hideElement('loadingRestaurants');

    displayRestaurants(restaurants);
    showElement('restaurantsGrid', 'grid');

    console.log(`✅ ${restaurants.length} restaurantes carregados da API`);

  } catch (error) {
    console.error('Erro ao carregar restaurantes:', error);
    hideElement('loadingRestaurants');
    showError('restaurantsGrid', 'Não foi possível carregar os restaurantes. Verifique se o servidor está rodando.');
  }
}

async function loadFullMenu() {
  const cardGrid = document.querySelector('.card-grid');
  if (!cardGrid) return;

  try {
    showLoading('cardGrid');
    
    const foods = await deliveryAPI.getFoods();
    
    displayFoods(foods);
    console.log(`✅ Menu completo carregado: ${foods.length} itens`);
    
  } catch (error) {
    console.error('Erro ao carregar menu completo:', error);
    showError('cardGrid', 'Erro ao carregar o cardápio');
  }
}

function displayFoods(foods) {
  const dishesGrid = document.getElementById('dishesGrid');
  const cardGrid = document.querySelector('.card-grid');
  const targetGrid = cardGrid || dishesGrid;
  
  if (!targetGrid) return;

  targetGrid.innerHTML = '';

  if (!foods || foods.length === 0) {
    targetGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #5c5c5c;">
        <p>Nenhum item encontrado</p>
      </div>
    `;
    return;
  }

  foods.forEach(food => {
    const dishCard = document.createElement('div');
    dishCard.className = dishesGrid ? 'dish-card' : 'card';
    
    if (dishesGrid) {
      dishCard.innerHTML = `
        <div class="dish-image" style="background-image: url('${food.image || 'https://via.placeholder.com/400x200?text=Sem+Imagem'}')"></div>
        <div class="dish-content">
          <h3 class="dish-title">${food.name || 'Nome não disponível'}</h3>
          <p class="dish-description">${food.description || 'Descrição não disponível'}</p>
          <div class="dish-tags">
            ${food.tags ? food.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </div>
          <div class="dish-footer">
            <span class="price">R$ ${food.price ? food.price.toFixed(2) : '0.00'}</span>
            <button class="add-btn" onclick="addToCart(${food.id}, '${food.name}', ${food.price || 0})">+ Adicionar</button>
          </div>
        </div>
      `;
    } 
    else {
      dishCard.innerHTML = `
        <img src="${food.image || 'https://via.placeholder.com/400x200?text=Sem+Imagem'}" alt="${food.name || 'Produto'}">
        <div class="card-content">
          <div class="card-title">${food.name || 'Nome não disponível'}</div>
          <div class="card-desc">${food.description || 'Descrição não disponível'}</div>
          <div class="tags">
            ${food.tags ? food.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
          </div>
          <div class="price-add">
            <div class="price">R$ ${food.price ? food.price.toFixed(2) : '0.00'}</div>
            <button class="add-btn" onclick="addToCart(${food.id}, '${food.name}', ${food.price || 0})">+ Adicionar</button>
          </div>
        </div>
      `;
    }
    
    targetGrid.appendChild(dishCard);
  });
}

function displayRestaurants(restaurants) {
  const restaurantsGrid = document.getElementById('restaurantsGrid');
  if (!restaurantsGrid) return;

  restaurantsGrid.innerHTML = '';

  if (!restaurants || restaurants.length === 0) {
    restaurantsGrid.innerHTML = `
      <div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: #5c5c5c;">
        <p>Nenhum restaurante encontrado</p>
      </div>
    `;
    return;
  }

  restaurants.forEach(restaurant => {
    const restaurantCard = document.createElement('div');
    restaurantCard.className = 'restaurant-card';

    restaurantCard.innerHTML = `
      <div class="restaurant-image" style="background-image: url('${restaurant.image || 'https://via.placeholder.com/400x200?text=Sem+Imagem'}')"></div>
      <div class="restaurant-content">
        <h3 class="restaurant-name">${restaurant.name || 'Nome não disponível'}</h3>
        <p class="restaurant-description">${restaurant.description || 'Descrição não disponível'}</p>
        <div class="restaurant-tags">
          ${restaurant.tags ? restaurant.tags.map(tag => `<span class="tag">${tag}</span>`).join('') : ''}
        </div>
      </div>
    `;

    restaurantsGrid.appendChild(restaurantCard);
  });
}

async function filterByCategory(category) {
  const cardGrid = document.querySelector('.card-grid');
  const dishesGrid = document.getElementById('dishesGrid');
  const targetGrid = cardGrid || dishesGrid;
  
  if (!targetGrid) return;

  try {
    const loadingId = cardGrid ? 'cardGrid' : 'dishesGrid';
    showLoading(loadingId);
    
    let foods;
    if (category === 'todos' || category === 'all') {
      foods = await deliveryAPI.getFoods();
    } else {
      foods = await deliveryAPI.getFoodsByCategory(category);
    }
    
    displayFoods(foods);
    
    updateActiveButton(category);
    
    console.log(`✅ Filtro aplicado: ${category} (${foods.length} itens)`);
    
  } catch (error) {
    console.error('Erro ao filtrar por categoria:', error);
    showError(cardGrid ? 'cardGrid' : 'dishesGrid', 'Erro ao filtrar produtos');
  }
}

function updateActiveButton(category) {
  document.querySelectorAll('.category-buttons button').forEach(btn => {
    btn.classList.remove('active');
  });
  
  const activeButton = Array.from(document.querySelectorAll('.category-buttons button'))
    .find(btn => btn.textContent.toLowerCase().includes(category.toLowerCase()) || 
                  (category === 'todos' && btn.textContent.toLowerCase() === 'todos'));
  
  if (activeButton) {
    activeButton.classList.add('active');
  }

  const categorySelect = document.querySelector('select.todos');
  if (categorySelect) {
    categorySelect.value = category;
  }
}

async function searchFoods(query) {
  if (!query.trim()) {
    if (document.querySelector('.card-grid')) {
      await loadFullMenu();
    } else {
      await loadFoodsData();
    }
    return;
  }

  try {
    const foods = await deliveryAPI.getFoods();
    const filteredFoods = foods.filter(food => 
      food.name?.toLowerCase().includes(query.toLowerCase()) ||
      food.description?.toLowerCase().includes(query.toLowerCase()) ||
      (food.tags && food.tags.some(tag => tag.toLowerCase().includes(query.toLowerCase())))
    );
    
    displayFoods(filteredFoods);
    console.log(`🔍 Busca por "${query}": ${filteredFoods.length} resultados`);
  } catch (error) {
    console.error('Erro ao buscar:', error);
  }
}

async function sortFoods(sortBy) {
  try {
    const foods = await deliveryAPI.getFoods();
    let sortedFoods = [...foods];
    
    switch (sortBy) {
      case 'nome':
        sortedFoods.sort((a, b) => a.name?.localeCompare(b.name) || 0);
        break;
      case 'preco':
        sortedFoods.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      default:
        break;
    }
    
    displayFoods(sortedFoods);
    console.log(`📊 Ordenação aplicada: ${sortBy}`);
  } catch (error) {
    console.error('Erro ao ordenar:', error);
  }
}

async function loadOrders() {
  const container = document.querySelector('.container');
  if (!container || !window.location.pathname.includes('pedidos')) return;

  try {
    console.log('🔄 Carregando pedidos...');
    const orders = await deliveryAPI.getOrders();
    displayOrders(orders);
    console.log(`✅ ${orders.length} pedidos carregados`);
  } catch (error) {
    console.error('Erro ao carregar pedidos:', error);
    showError('container', 'Erro ao carregar pedidos. Verifique se o servidor está rodando.');
  }
}

function displayOrders(orders) {
  const container = document.querySelector('.container');
  if (!container) return;

  const pendingOrders = orders.filter(order => 
    order.status !== 'Entregue' && order.status !== 'Cancelado'
  );
  
  const completedOrders = orders.filter(order => 
    order.status === 'Entregue'
  );

  const existingContent = container.querySelectorAll('h2, .pedido');
  existingContent.forEach(el => el.remove());

  if (pendingOrders.length > 0) {
    const pendingTitle = document.createElement('h2');
    pendingTitle.innerHTML = '🕐 Pedidos Pendentes';
    container.appendChild(pendingTitle);

    pendingOrders.forEach(order => {
      const orderDiv = createOrderElement(order, false);
      container.appendChild(orderDiv);
    });
  } else {
    const pendingTitle = document.createElement('h2');
    pendingTitle.innerHTML = '🕐 Pedidos Pendentes';
    container.appendChild(pendingTitle);
    
    const noOrders = document.createElement('div');
    noOrders.className = 'pedido';
    noOrders.innerHTML = '<p style="text-align: center; color: #5c5c5c;">Nenhum pedido pendente</p>';
    container.appendChild(noOrders);
  }

  if (completedOrders.length > 0) {
    const completedTitle = document.createElement('h2');
    completedTitle.innerHTML = '✅ Pedidos Concluídos';
    container.appendChild(completedTitle);

    completedOrders.forEach(order => {
      const orderDiv = createOrderElement(order, true);
      container.appendChild(orderDiv);
    });
  }
}

function createOrderElement(order, isCompleted) {
  const orderDiv = document.createElement('div');
  orderDiv.className = 'pedido';
  
  const statusClass = order.status === 'Em preparo' ? 'preparo' : 
                     order.status === 'Saiu para entrega' ? 'entrega' : 'concluido';

  orderDiv.innerHTML = `
    <h3>Cliente: ${order.customer_name || order.customerName || 'Nome não informado'}</h3>
    <ul>
      <li>Pedido #${order.id} - R$ ${(order.total || 0).toFixed(2)}</li>
      <li>Horário: ${order.created_at || order.createdAt || 'Horário não informado'}</li>
      ${order.items && order.items.length > 0 ? 
        order.items.map(item => `<li>${item.name || 'Item'} - R$ ${(item.price || 0).toFixed(2)}</li>`).join('') : 
        '<li>Itens não especificados</li>'
      }
    </ul>
    <div class="status ${statusClass}">Status: ${order.status}</div>
    <div class="actions">
      ${!isCompleted ? `
        <button onclick="updateOrderStatus(${order.id}, 'Saiu para entrega')">Marcar como Saiu</button>
        <button onclick="updateOrderStatus(${order.id}, 'Entregue')">Marcar como Entregue</button>
        <button onclick="updateOrderStatus(${order.id}, 'Cancelado')" style="background: #e74c3c;">Cancelar</button>
      ` : `
        <button onclick="viewOrder(${order.id})">Visualizar</button>
      `}
    </div>
  `;
  
  return orderDiv;
}

async function updateOrderStatus(orderId, newStatus) {
  try {
    console.log(`🔄 Atualizando pedido #${orderId} para: ${newStatus}`);
    await deliveryAPI.updateOrderStatus(orderId, newStatus);
    alert(`Status do pedido #${orderId} atualizado para: ${newStatus}`);
    await loadOrders();
    console.log(`✅ Pedido #${orderId} atualizado com sucesso`);
  } catch (error) {
    console.error('Erro ao atualizar status:', error);
    alert('Erro ao atualizar status do pedido. Verifique se o servidor está rodando.');
  }
}

function viewOrder(orderId) {
  alert(`Visualizar pedido #${orderId}\n\nEsta funcionalidade pode ser expandida para mostrar detalhes completos do pedido.`);
}

let cart = [];
let cartCount = 0;

function addToCart(foodId, foodName, price) {
  const item = {
    id: foodId,
    name: foodName,
    price: price,
    quantity: 1
  };
  
  const existingItem = cart.find(cartItem => cartItem.id === foodId);
  if (existingItem) {
    existingItem.quantity += 1;
  } else {
    cart.push(item);
  }
  
  cartCount += 1;
  updateCartIcon();
  
  showCartFeedback(foodName, price);
  
  console.log('📦 Item adicionado ao carrinho:', item);
  console.log('🛒 Carrinho atual:', cart);
}

function updateCartIcon() {
  const cartIcon = document.querySelector('.cart-icon');
  if (cartIcon) {
    let cartCountElement = cartIcon.querySelector('.cart-count');
    
    if (!cartCountElement) {
      cartCountElement = document.createElement('span');
      cartCountElement.className = 'cart-count';
      cartCountElement.style.cssText = `
        position: absolute;
        top: -8px;
        right: -8px;
        background: #FF4757;
        color: white;
        border-radius: 50%;
        width: 18px;
        height: 18px;
        font-size: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: bold;
      `;
      cartIcon.style.position = 'relative';
      cartIcon.appendChild(cartCountElement);
    }
    
    cartCountElement.textContent = cartCount;
    
    if (cartCount === 0) {
      cartCountElement.style.display = 'none';
    } else {
      cartCountElement.style.display = 'flex';
    }
  }
}

function showCartFeedback(foodName, price) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 10px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
    z-index: 1000;
    transform: translateX(100%);
    transition: transform 0.3s ease;
  `;
  
  notification.innerHTML = `
    <strong>✅ Adicionado ao carrinho!</strong><br>
    ${foodName} - R$ ${price.toFixed(2)}
  `;
  
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(0)';
  }, 100);
  
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    setTimeout(() => {
      document.body.removeChild(notification);
    }, 300);
  }, 3000);
}

function setupPageEvents() {
  const searchInput = document.querySelector('input[placeholder*="Buscar"]');
  if (searchInput) {
    let searchTimeout;
    searchInput.addEventListener('input', (e) => {
      clearTimeout(searchTimeout);
      searchTimeout = setTimeout(() => {
        searchFoods(e.target.value);
      }, 500);
    });
  }

  const sortSelects = document.querySelectorAll('select');
  sortSelects.forEach(select => {
    if (select.querySelector('option[value="nome"]')) {
      select.addEventListener('change', (e) => {
        sortFoods(e.target.value);
      });
    }
  });

  const categorySelect = document.querySelector('select.todos');
  if (categorySelect) {
    categorySelect.addEventListener('change', (e) => {
      filterByCategory(e.target.value);
    });
  }

  const categoryButtons = document.querySelectorAll('.category-buttons button');
  categoryButtons.forEach(button => {
    button.addEventListener('click', () => {
      const category = button.textContent.toLowerCase();
      filterByCategory(category);
    });
  });

  const categoryCards = document.querySelectorAll('.category-card');
  categoryCards.forEach(card => {
    card.addEventListener('click', () => {
      const categoryName = card.querySelector('h3').textContent.toLowerCase();
      window.location.href = `cardapio.html?category=${categoryName}`;
    });
  });

  const searchIcon = document.querySelector('.search-icon');
  if (searchIcon) {
    searchIcon.addEventListener('click', () => {
      const searchInput = document.querySelector('input[placeholder*="Buscar"]');
      if (searchInput) {
        searchInput.focus();
      }
    });
  }

  const menuButtons = document.querySelectorAll('.btn-primary, button[onclick*="showMenu"]');
  menuButtons.forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      if (window.location.pathname.includes('index') || window.location.pathname === '/') {
        window.location.href = 'cardapio.html';
      } else {
        document.querySelector('.featured-dishes')?.scrollIntoView({
          behavior: 'smooth'
        });
      }
    });
  });
}

async function checkAPIHealth() {
  try {
    const health = await deliveryAPI.healthCheck();
    console.log('✅ Status da API:', health);
    return health;
  } catch (error) {
    console.error('❌ API não está respondendo:', error);
    return null;
  }
}

function displayMockFoods() {
  const mockFoods = [
    {
      id: 1,
      name: "Pizza Margherita Suprema",
      description: "Molho de tomate artesanal, mussarela premium, manjericão fresco",
      price: 45.90,
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?w=400",
      tags: ["Mussarela", "Manjericão"]
    },
    {
      id: 2,
      name: "Burger Classic Deluxe", 
      description: "Hambúrguer artesanal 180g, queijo cheddar, alface, tomate",
      price: 35.90,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
      tags: ["Carne 180g", "Cheddar"]
    },
    {
      id: 3,
      name: "Café Expresso Premium",
      description: "Café expresso com grãos italianos, leite cremoso e canela",
      price: 12.90,
      image: "https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400",
      tags: ["Café", "Premium"]
    }
  ];
  
  displayFoods(mockFoods);
  console.log('📋 Usando dados de demonstração');
}

document.addEventListener('DOMContentLoaded', async function() {
  console.log('🚀 Inicializando Delivery App...');
  
  const apiHealth = await checkAPIHealth();
  
  setupPageEvents();
  
  const urlParams = new URLSearchParams(window.location.search);
  const categoryParam = urlParams.get('category');
  
  const currentPage = window.location.pathname;
  
  if (currentPage.includes('cardapio') || currentPage === '/cardapio.html') {
    console.log('📋 Carregando página do cardápio...');
    if (categoryParam) {
      console.log(`🏷️ Aplicando filtro de categoria: ${categoryParam}`);
      await filterByCategory(categoryParam);
    } else {
      await loadFullMenu();
    }
  } 
  else if (currentPage.includes('pedidos') || currentPage === '/pedidos.html') {
    console.log('📦 Carregando página de pedidos...');
    await loadOrders();
  }
  else if (currentPage === '/' || currentPage.includes('index')) {
    console.log('🏠 Carregando página inicial...');
    await loadFoodsData(3);
    await loadRestaurantsData();
  }
  
  console.log('✅ Delivery App inicializado!');
  
  if (!apiHealth) {
    console.warn('⚠️ API não está disponível. Funcionalidades limitadas.');
  }
});

window.deliveryAPI = deliveryAPI;
window.filterByCategory = filterByCategory;
window.addToCart = addToCart;
window.updateOrderStatus = updateOrderStatus;
window.viewOrder = viewOrder;
window.showMenu = () => window.location.href = 'cardapio.html';
window.searchFoods = searchFoods;
window.sortFoods = sortFoods;
