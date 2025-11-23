// Main Vue Application
new Vue({
    el: '#app',
    data() {
        return {
            // Tab state
            activeTab: 'stock',
            
            // Data arrays
            bahanAjarList: [],
            deliveryOrders: [],
            
            // Flash message
            flashMessage: null,
            
            // Modal state
            modal: {
                show: false,
                title: '',
                message: '',
                type: 'info',
                onConfirm: null
            },
            
            // Loading states
            loading: {
                bahanAjar: false,
                deliveryOrders: false
            }
        };
    },
    
    computed: {
        // Computed properties untuk statistik atau filtering jika diperlukan
        totalBahanAjar() {
            return this.bahanAjarList.length;
        },
        
        totalDeliveryOrders() {
            return this.deliveryOrders.length;
        },
        
        lowStockItems() {
            return this.bahanAjarList.filter(item => 
                item.qty < item.safety && item.qty > 0
            ).length;
        },
        
        outOfStockItems() {
            return this.bahanAjarList.filter(item => item.qty === 0).length;
        }
    },
    
    watch: {
        // Watcher untuk activeTab
        activeTab(newTab, oldTab) {
            console.log(`Tab changed from ${oldTab} to ${newTab}`);
            // Bisa digunakan untuk analytics atau loading data spesifik tab
        },
        
        // Watcher untuk perubahan data bahan ajar
        bahanAjarList: {
            handler(newList) {
                // Auto-save ke localStorage sebagai backup
                if (newList.length > 0) {
                    localStorage.setItem('bahanAjarBackup', JSON.stringify(newList));
                }
            },
            deep: true
        },
        
        // Watcher untuk delivery orders
        deliveryOrders: {
            handler(newOrders) {
                // Auto-save ke localStorage sebagai backup
                if (newOrders.length > 0) {
                    localStorage.setItem('deliveryOrdersBackup', JSON.stringify(newOrders));
                }
            },
            deep: true
        }
    },
    
    methods: {
        // Data loading methods
        async loadInitialData() {
            try {
                this.loading.bahanAjar = true;
                this.loading.deliveryOrders = true;
                
                // Load data dari API service
                const data = await apiService.fetchData();
                
                // Load bahan ajar
                this.bahanAjarList = data.bahanAjar || [];
                
                // Load delivery orders
                this.deliveryOrders = data.deliveryOrders || [];
                
                console.log('Data loaded successfully');
                
            } catch (error) {
                console.error('Error loading initial data:', error);
                this.showFlash({
                    type: 'danger',
                    text: 'Gagal memuat data. Mencoba memuat data backup...'
                });
                
                // Try to load from localStorage backup
                this.loadFromBackup();
                
            } finally {
                this.loading.bahanAjar = false;
                this.loading.deliveryOrders = false;
            }
        },
        
        loadFromBackup() {
            try {
                // Load from localStorage backup
                const bahanAjarBackup = localStorage.getItem('bahanAjarBackup');
                const deliveryOrdersBackup = localStorage.getItem('deliveryOrdersBackup');
                
                if (bahanAjarBackup) {
                    this.bahanAjarList = JSON.parse(bahanAjarBackup);
                }
                
                if (deliveryOrdersBackup) {
                    this.deliveryOrders = JSON.parse(deliveryOrdersBackup);
                }
                
                if (bahanAjarBackup || deliveryOrdersBackup) {
                    this.showFlash({
                        type: 'warning',
                        text: 'Data dimuat dari backup lokal'
                    });
                }
            } catch (error) {
                console.error('Error loading backup data:', error);
            }
        },
        
        // Bahan Ajar CRUD methods
        addBahanAjar(newItem) {
            // Check if kode already exists
            const existingItem = this.bahanAjarList.find(item => item.kode === newItem.kode);
            if (existingItem) {
                this.showFlash({
                    type: 'warning',
                    text: 'Kode bahan ajar sudah ada'
                });
                return;
            }
            
            this.bahanAjarList.push(newItem);
        },
        
        updateBahanAjar(updatedItem) {
            const index = this.bahanAjarList.findIndex(item => item.id === updatedItem.id);
            if (index !== -1) {
                // Check if new kode conflicts with existing items (excluding current item)
                const existingItem = this.bahanAjarList.find(item => 
                    item.kode === updatedItem.kode && item.id !== updatedItem.id
                );
                if (existingItem) {
                    this.showFlash({
                        type: 'warning',
                        text: 'Kode bahan ajar sudah digunakan oleh item lain'
                    });
                    return;
                }
                
                Vue.set(this.bahanAjarList, index, updatedItem);
            }
        },
        
        deleteBahanAjar(itemId) {
            const index = this.bahanAjarList.findIndex(item => item.id === itemId);
            if (index !== -1) {
                this.bahanAjarList.splice(index, 1);
            }
        },
        
        // Delivery Order methods
        addDeliveryOrder(newOrder) {
            this.deliveryOrders.push(newOrder);
        },
        
        updateDeliveryOrder(updatedOrder) {
            const index = this.deliveryOrders.findIndex(order => order.id === updatedOrder.id);
            if (index !== -1) {
                Vue.set(this.deliveryOrders, index, updatedOrder);
            }
        },
        
        // Order methods
        createOrder(order) {
            // Process order (in real app, this would send to backend)
            console.log('New order created:', order);
            
            // Optionally, reduce stock quantities
            order.items.forEach(orderItem => {
                const bahanAjar = this.bahanAjarList.find(item => item.id === orderItem.id);
                if (bahanAjar && bahanAjar.qty >= orderItem.qty) {
                    bahanAjar.qty -= orderItem.qty;
                }
            });
            
            // Optionally, create delivery order automatically
            const deliveryOrder = {
                id: this.deliveryOrders.length + 1,
                nomorDO: apiService.generateDONumber(this.deliveryOrders),
                nim: order.nim,
                nama: order.nama,
                ekspedisi: order.ekspedisi,
                paket: 'Paket Custom',
                detailPaket: order.items.map(item => ({
                    kode: item.kode,
                    judul: item.judul,
                    qty: item.qty
                })),
                tanggalKirim: apiService.formatDate(new Date()),
                totalHarga: order.total,
                statusProgress: [{
                    waktu: new Date().toISOString(),
                    keterangan: 'Pesanan diterima dan sedang diproses'
                }]
            };
            
            this.addDeliveryOrder(deliveryOrder);
        },
        
        // Flash message methods
        showFlash(message) {
            this.flashMessage = message;
            // Auto-hide after 5 seconds
            setTimeout(() => {
                this.clearFlashMessage();
            }, 5000);
        },
        
        clearFlashMessage() {
            this.flashMessage = null;
        },
        
        // Modal methods
        showModal(options) {
            this.modal = {
                show: true,
                title: options.title || 'Konfirmasi',
                message: options.message || '',
                type: options.type || 'info',
                onConfirm: options.onConfirm || null
            };
        },
        
        handleModalConfirm() {
            if (this.modal.onConfirm && typeof this.modal.onConfirm === 'function') {
                this.modal.onConfirm();
            }
            this.closeModal();
        },
        
        closeModal() {
            this.modal.show = false;
            this.modal.onConfirm = null;
        },
        
        // Utility methods
        formatCurrency(amount) {
            return apiService.formatCurrency(amount);
        },
        
        // Export/Import methods (bonus features)
        exportData() {
            const exportData = {
                bahanAjar: this.bahanAjarList,
                deliveryOrders: this.deliveryOrders,
                exportDate: new Date().toISOString()
            };
            
            const dataStr = JSON.stringify(exportData, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `ut-bahan-ajar-${new Date().toISOString().split('T')[0]}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            this.showFlash({
                type: 'success',
                text: 'Data berhasil diekspor'
            });
        },
        
        // Keyboard shortcuts
        handleKeyboardShortcuts(event) {
            // Ctrl + 1, 2, 3 untuk switch tab
            if (event.ctrlKey) {
                switch (event.key) {
                    case '1':
                        event.preventDefault();
                        this.activeTab = 'stock';
                        break;
                    case '2':
                        event.preventDefault();
                        this.activeTab = 'tracking';
                        break;
                    case '3':
                        event.preventDefault();
                        this.activeTab = 'order';
                        break;
                }
            }
        }
    },
    
    // Lifecycle hooks
    async created() {
        console.log('Vue app created');
        await this.loadInitialData();
    },
    
    mounted() {
        console.log('Vue app mounted');
        
        // Add keyboard shortcuts
        document.addEventListener('keydown', this.handleKeyboardShortcuts);
        
        // Show welcome message
        setTimeout(() => {
            this.showFlash({
                type: 'info',
                text: 'Selamat datang di Sistem Bahan Ajar UT!'
            });
        }, 1000);
    },
    
    beforeDestroy() {
        // Cleanup
        document.removeEventListener('keydown', this.handleKeyboardShortcuts);
    }
});
