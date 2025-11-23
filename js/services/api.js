// API Service Layer untuk aplikasi UT Bahan Ajar
class ApiService {
    constructor() {
        this.baseUrl = './data';
        this.cache = new Map();
    }

    // Fetch data JSON dengan caching
    async fetchData(filename = 'dataBahanAjar.json') {
        const cacheKey = filename;
        
        if (this.cache.has(cacheKey)) {
            return this.cache.get(cacheKey);
        }

        try {
            const response = await fetch(`${this.baseUrl}/${filename}`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            this.cache.set(cacheKey, data);
            return data;
        } catch (error) {
            console.error('Error fetching data:', error);
            throw error;
        }
    }

    // Get semua data bahan ajar
    async getBahanAjar() {
        const data = await this.fetchData();
        return data.bahanAjar || [];
    }

    // Get data delivery orders
    async getDeliveryOrders() {
        const data = await this.fetchData();
        return data.deliveryOrders || [];
    }

    // Get opsi ekspedisi
    async getEkspedisiOptions() {
        const data = await this.fetchData();
        return data.ekspedisiOptions || [];
    }

    // Get opsi paket
    async getPaketOptions() {
        const data = await this.fetchData();
        return data.paketOptions || [];
    }

    // Get opsi UPBJJ
    async getUpbjjOptions() {
        const data = await this.fetchData();
        return data.upbjjOptions || [];
    }

    // Helper functions untuk formatting
    formatCurrency(amount) {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    }

    formatQuantity(qty) {
        return `${qty} buah`;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            timeZone: 'Asia/Jakarta'
        };
        return date.toLocaleDateString('id-ID', options);
    }

    formatDateTime(dateTimeString) {
        const date = new Date(dateTimeString);
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        };
        return date.toLocaleDateString('id-ID', options);
    }

    // Generate nomor DO otomatis
    generateDONumber(existingDOs = []) {
        const currentYear = new Date().getFullYear();
        const yearPrefix = `DO${currentYear}-`;
        
        // Cari nomor terakhir dari tahun ini
        const currentYearDOs = existingDOs.filter(order => 
            order.nomorDO.startsWith(yearPrefix)
        );
        
        let maxSequence = 0;
        currentYearDOs.forEach(order => {
            const sequence = parseInt(order.nomorDO.split('-')[1]);
            if (sequence > maxSequence) {
                maxSequence = sequence;
            }
        });
        
        const nextSequence = maxSequence + 1;
        return `${yearPrefix}${nextSequence.toString().padStart(3, '0')}`;
    }

    // Validate form data
    validateBahanAjar(item) {
        const errors = [];
        
        if (!item.kode || item.kode.trim() === '') {
            errors.push('Kode bahan ajar wajib diisi');
        }
        
        if (!item.judul || item.judul.trim() === '') {
            errors.push('Judul bahan ajar wajib diisi');
        }
        
        if (!item.kategori || item.kategori.trim() === '') {
            errors.push('Kategori wajib dipilih');
        }
        
        if (!item.upbjj || item.upbjj.trim() === '') {
            errors.push('UPBJJ wajib dipilih');
        }
        
        if (!item.harga || item.harga <= 0) {
            errors.push('Harga harus lebih dari 0');
        }
        
        if (item.qty < 0) {
            errors.push('Quantity tidak boleh negatif');
        }
        
        if (item.safety < 0) {
            errors.push('Safety stock tidak boleh negatif');
        }
        
        return errors;
    }

    validateDeliveryOrder(order) {
        const errors = [];
        
        if (!order.nim || !/^\d{9}$/.test(order.nim)) {
            errors.push('NIM harus 9 digit angka');
        }
        
        if (!order.nama || order.nama.trim() === '') {
            errors.push('Nama wajib diisi');
        }
        
        if (!order.ekspedisi) {
            errors.push('Ekspedisi wajib dipilih');
        }
        
        if (!order.paket) {
            errors.push('Paket wajib dipilih');
        }
        
        return errors;
    }

    // Search functions
    searchBahanAjar(items, searchTerm) {
        if (!searchTerm) return items;
        
        const term = searchTerm.toLowerCase();
        return items.filter(item => 
            item.kode.toLowerCase().includes(term) ||
            item.judul.toLowerCase().includes(term) ||
            item.kategori.toLowerCase().includes(term) ||
            item.upbjj.toLowerCase().includes(term)
        );
    }

    searchDeliveryOrder(orders, searchTerm) {
        if (!searchTerm) return orders;
        
        const term = searchTerm.toLowerCase();
        return orders.filter(order => 
            order.nomorDO.toLowerCase().includes(term) ||
            order.nim.includes(term) ||
            order.nama.toLowerCase().includes(term)
        );
    }

    // Filter functions
    filterByUpbjj(items, upbjj) {
        if (!upbjj) return items;
        return items.filter(item => item.upbjj === upbjj);
    }

    filterByKategori(items, kategori) {
        if (!kategori) return items;
        return items.filter(item => item.kategori === kategori);
    }

    filterByStockCondition(items, condition) {
        switch (condition) {
            case 'aman':
                return items.filter(item => item.qty >= item.safety && item.qty > 0);
            case 'menipis':
                return items.filter(item => item.qty < item.safety && item.qty > 0);
            case 'kosong':
                return items.filter(item => item.qty === 0);
            default:
                return items;
        }
    }

    // Sort functions
    sortItems(items, sortBy, sortDirection = 'asc') {
        return [...items].sort((a, b) => {
            let aValue = a[sortBy];
            let bValue = b[sortBy];
            
            // Handle string comparisons
            if (typeof aValue === 'string') {
                aValue = aValue.toLowerCase();
                bValue = bValue.toLowerCase();
            }
            
            let comparison = 0;
            if (aValue > bValue) {
                comparison = 1;
            } else if (aValue < bValue) {
                comparison = -1;
            }
            
            return sortDirection === 'desc' ? comparison * -1 : comparison;
        });
    }

    // Get unique categories from items
    getUniqueCategories(items) {
        const categories = items.map(item => item.kategori);
        return [...new Set(categories)].sort();
    }

    // Determine stock status
    getStockStatus(qty, safety) {
        if (qty === 0) return 'kosong';
        if (qty < safety) return 'menipis';
        return 'aman';
    }

    // Clear cache
    clearCache() {
        this.cache.clear();
    }

    // Debounce function for search
    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Create global instance
window.apiService = new ApiService();
