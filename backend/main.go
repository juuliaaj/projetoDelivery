package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"path/filepath"
	"strconv"
	"time"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

type User struct {
	ID       int    `json:"id"`
	Name     string `json:"name"`
	Email    string `json:"email"`
	Phone    string `json:"phone"`
	Address  string `json:"address"`
	Avatar   string `json:"avatar"`
}

type Restaurant struct {
	ID          int     `json:"id"`
	Name        string  `json:"name"`
	Description string  `json:"description"`
	Image       string  `json:"image"`
	Category    string  `json:"category"`
	Rating      float64 `json:"rating"`
	DeliveryTime string `json:"delivery_time"`
	DeliveryFee  float64 `json:"delivery_fee"`
	Address     string  `json:"address"`
}

type Food struct {
	ID           int      `json:"id"`
	Name         string   `json:"name"`
	Description  string   `json:"description"`
	Image        string   `json:"image"`
	Price        float64  `json:"price"`
	Category     string   `json:"category"`
	Tags         []string `json:"tags"`
	RestaurantID int      `json:"restaurant_id"`
	Available    bool     `json:"available"`
}

type Order struct {
	ID         int     `json:"id"`
	UserID     int     `json:"user_id"`
	Items      []Food  `json:"items"`
	Total      float64 `json:"total"`
	Status     string  `json:"status"`
	CreatedAt  string  `json:"created_at"`
	CustomerName string `json:"customer_name"`
}

var httpClient = &http.Client{
	Timeout: 10 * time.Second,
}

const baseURL = "https://apifakedelivery.vercel.app"

var (
	cachedFoods       []Food
	cachedRestaurants []Restaurant
	cachedUsers       []User
	lastCacheUpdate   time.Time
	cacheDuration     = 5 * time.Minute
)

var mockOrders = []Order{
	{
		ID:         1,
		UserID:     1,
		Items:      []Food{},
		Total:      45.90,
		Status:     "Em preparo",
		CreatedAt:  time.Now().Add(-30 * time.Minute).Format("15:04"),
		CustomerName: "João Silva",
	},
	{
		ID:         2,
		UserID:     2,
		Items:      []Food{},
		Total:      35.80,
		Status:     "Saiu para entrega",
		CreatedAt:  time.Now().Add(-15 * time.Minute).Format("15:04"),
		CustomerName: "Ana Souza",
	},
	{
		ID:         3,
		UserID:     3,
		Items:      []Food{},
		Total:      52.70,
		Status:     "Entregue",
		CreatedAt:  time.Now().Add(-60 * time.Minute).Format("15:04"),
		CustomerName: "Pedro Lima",
	},
}

func makeRequest(endpoint string) ([]byte, error) {
	resp, err := httpClient.Get(baseURL + endpoint)
	if err != nil {
		return nil, fmt.Errorf("erro ao fazer requisição: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("erro ao ler response: %w", err)
	}

	return body, nil
}

func updateCacheIfNeeded() error {
	if time.Since(lastCacheUpdate) < cacheDuration && len(cachedFoods) > 0 {
		return nil
	}

	if data, err := makeRequest("/foods"); err == nil {
		if err := json.Unmarshal(data, &cachedFoods); err == nil {
			log.Println("Cache de foods atualizado")
		}
	}

	if data, err := makeRequest("/restaurants"); err == nil {
		if err := json.Unmarshal(data, &cachedRestaurants); err == nil {
			log.Println("Cache de restaurants atualizado")
		}
	}

	if data, err := makeRequest("/users"); err == nil {
		if err := json.Unmarshal(data, &cachedUsers); err == nil {
			log.Println("Cache de users atualizado")
		}
	}

	lastCacheUpdate = time.Now()
	return nil
}

func serveStaticFiles(w http.ResponseWriter, r *http.Request) {
	var fileName string
	switch r.URL.Path {
	case "/", "/index.html":
		fileName = "index.html"
	case "/cardapio", "/cardapio.html":
		fileName = "cardapio.html"
	case "/pedidos", "/pedidos.html":
		fileName = "pedidos.html"
	default:
		http.NotFound(w, r)
		return
	}

	http.ServeFile(w, r, filepath.Join("static", fileName))
}

func getUsersHandler(w http.ResponseWriter, r *http.Request) {
	updateCacheIfNeeded()
	
	if len(cachedUsers) > 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cachedUsers)
		return
	}

	data, err := makeRequest("/users")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func getUserByIDHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	data, err := makeRequest("/users/" + id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func getRestaurantsHandler(w http.ResponseWriter, r *http.Request) {
	updateCacheIfNeeded()
	
	if len(cachedRestaurants) > 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cachedRestaurants)
		return
	}

	data, err := makeRequest("/restaurants")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func getRestaurantByIDHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	data, err := makeRequest("/restaurants/" + id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func getFoodsHandler(w http.ResponseWriter, r *http.Request) {
	updateCacheIfNeeded()
	
	if len(cachedFoods) > 0 {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(cachedFoods)
		return
	}

	data, err := makeRequest("/foods")
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func getFoodByIDHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	id := vars["id"]

	data, err := makeRequest("/foods/" + id)
	if err != nil {
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	w.Write(data)
}

func getFoodsByRestaurantHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	restaurantID, err := strconv.Atoi(vars["restaurantId"])
	if err != nil {
		http.Error(w, "ID do restaurante inválido", http.StatusBadRequest)
		return
	}

	updateCacheIfNeeded()
	
	var foods []Food
	if len(cachedFoods) > 0 {
		foods = cachedFoods
	} else {
		data, err := makeRequest("/foods")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := json.Unmarshal(data, &foods); err != nil {
			http.Error(w, "Erro ao processar dados", http.StatusInternalServerError)
			return
		}
	}

	var filteredFoods []Food
	for _, food := range foods {
		if food.RestaurantID == restaurantID {
			filteredFoods = append(filteredFoods, food)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filteredFoods)
}

func getFoodsByCategoryHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	category := vars["category"]

	updateCacheIfNeeded()
	
	var foods []Food
	if len(cachedFoods) > 0 {
		foods = cachedFoods
	} else {
		data, err := makeRequest("/foods")
		if err != nil {
			http.Error(w, err.Error(), http.StatusInternalServerError)
			return
		}

		if err := json.Unmarshal(data, &foods); err != nil {
			http.Error(w, "Erro ao processar dados", http.StatusInternalServerError)
			return
		}
	}

	var filteredFoods []Food
	for _, food := range foods {
		if food.Category == category {
			filteredFoods = append(filteredFoods, food)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(filteredFoods)
}

func getOrdersHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(mockOrders)
}

func updateOrderStatusHandler(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	orderID, err := strconv.Atoi(vars["id"])
	if err != nil {
		http.Error(w, "ID do pedido inválido", http.StatusBadRequest)
		return
	}

	var request struct {
		Status string `json:"status"`
	}
	
	if err := json.NewDecoder(r.Body).Decode(&request); err != nil {
		http.Error(w, "Dados inválidos", http.StatusBadRequest)
		return
	}

	for i, order := range mockOrders {
		if order.ID == orderID {
			mockOrders[i].Status = request.Status
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(mockOrders[i])
			return
		}
	}

	http.Error(w, "Pedido não encontrado", http.StatusNotFound)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	response := map[string]interface{}{
		"status":    "OK",
		"message":   "Delivery API está rodando!",
		"time":      time.Now().Format(time.RFC3339),
		"cache_age": time.Since(lastCacheUpdate).String(),
		"cached_items": map[string]int{
			"foods":       len(cachedFoods),
			"restaurants": len(cachedRestaurants),
			"users":       len(cachedUsers),
		},
	}
	
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func main() {
	r := mux.NewRouter()

	r.HandleFunc("/", serveStaticFiles).Methods("GET")
	r.HandleFunc("/index.html", serveStaticFiles).Methods("GET")
	r.HandleFunc("/cardapio", serveStaticFiles).Methods("GET")
	r.HandleFunc("/cardapio.html", serveStaticFiles).Methods("GET")
	r.HandleFunc("/pedidos", serveStaticFiles).Methods("GET")
	r.HandleFunc("/pedidos.html", serveStaticFiles).Methods("GET")

	api := r.PathPrefix("/api").Subrouter()

	api.HandleFunc("/health", healthHandler).Methods("GET")

	api.HandleFunc("/users", getUsersHandler).Methods("GET")
	api.HandleFunc("/users/{id:[0-9]+}", getUserByIDHandler).Methods("GET")

	api.HandleFunc("/restaurants", getRestaurantsHandler).Methods("GET")
	api.HandleFunc("/restaurants/{id:[0-9]+}", getRestaurantByIDHandler).Methods("GET")

	api.HandleFunc("/foods", getFoodsHandler).Methods("GET")
	api.HandleFunc("/foods/{id:[0-9]+}", getFoodByIDHandler).Methods("GET")
	api.HandleFunc("/foods/restaurant/{restaurantId:[0-9]+}", getFoodsByRestaurantHandler).Methods("GET")
	api.HandleFunc("/foods/category/{category}", getFoodsByCategoryHandler).Methods("GET")

	api.HandleFunc("/orders", getOrdersHandler).Methods("GET")
	api.HandleFunc("/orders/{id:[0-9]+}/status", updateOrderStatusHandler).Methods("PUT")

	c := cors.New(cors.Options{
		AllowedOrigins: []string{
			"*",
		},
		AllowedMethods: []string{
			http.MethodGet,
			http.MethodPost,
			http.MethodPut,
			http.MethodDelete,
			http.MethodOptions,
		},
		AllowedHeaders: []string{
			"*",
		},
		AllowCredentials: false,
	})

	handler := c.Handler(r)

	port := ":8080"
	fmt.Printf("🚀 Servidor rodando na porta %s\n", port)
	fmt.Printf("🌐 Acesse: http://localhost%s\n", port)
	fmt.Println("📱 Páginas disponíveis:")
	fmt.Printf("   http://localhost%s/ (Início)\n", port)
	fmt.Printf("   http://localhost%s/cardapio (Cardápio)\n", port)
	fmt.Printf("   http://localhost%s/pedidos (Pedidos)\n", port)
	fmt.Println("🔧 API Endpoints:")
	fmt.Println("   GET /api/health")
	fmt.Println("   GET /api/users")
	fmt.Println("   GET /api/users/{id}")
	fmt.Println("   GET /api/restaurants")
	fmt.Println("   GET /api/restaurants/{id}")
	fmt.Println("   GET /api/foods")
	fmt.Println("   GET /api/foods/{id}")
	fmt.Println("   GET /api/foods/restaurant/{restaurantId}")
	fmt.Println("   GET /api/foods/category/{category}")
	fmt.Println("   GET /api/orders")
	fmt.Println("   PUT /api/orders/{id}/status")

	go func() {
		fmt.Println("🔄 Inicializando cache...")
		updateCacheIfNeeded()
		fmt.Println("✅ Cache inicializado!")
	}()

	log.Fatal(http.ListenAndServe(port, handler))
}