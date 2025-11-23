// DO Tracking Component
Vue.component('do-tracking', {
    template: '#tpl-tracking',
    props: {
        deliveryOrders: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            // Search states
            searchTerm: '',
            
            // Form states
            showAddForm: false,
            newDO: {
                nomorDO: '',
                nim: '',
                nama: '',
                ekspedisi: '',
                paket: '',
                tanggalKirimInput: '',
                tanggalKirim: '',
                totalHarga: 0,
                detailPaket: [],
                statusProgress: []
            },
            
            // Progress form states
            showProgressForm: {},
            newProgress: {},
            
            // Options
            ekspedisiOptions: [],
            paketOptions: [],
            selectedPaketDetail: null,
            
            // UI states
            loading: false
        };
    },
    computed: {
        filteredOrders() {
            if (!this.searchTerm) return this.deliveryOrders;
            return apiService.searchDeliveryOrder(this.deliveryOrders, this.searchTerm);
        }
    },
    watch: {
        // Watcher untuk search dengan debounce
        searchTerm: {
            handler: function(newValue) {
                this.debouncedSearch();
            }
        }
    },
    methods: {
        // API methods
        async loadOptions() {
            try {
                this.ekspedisiOptions = await apiService.getEkspedisiOptions();
                this.paketOptions = await apiService.getPaketOptions();
            } catch (error) {
                console.error('Error loading options:', error);
            }
        },
        
        // Search methods
        performSearch() {
            // Search sudah otomatis karena computed property
        },
        
        resetSearch() {
            this.searchTerm = '';
        },
        
        // Form methods
        showAddFormMethod() {
            this.showAddForm = true;
            this.resetNewDOForm();
            // Generate nomor DO baru
            this.newDO.nomorDO = apiService.generateDONumber(this.deliveryOrders);
            // Set tanggal kirim default ke hari ini
            const today = new Date().toISOString().split('T')[0];
            this.newDO.tanggalKirimInput = today;
        },
        
        resetNewDOForm() {
            this.newDO = {
                nomorDO: '',
                nim: '',
                nama: '',
                ekspedisi: '',
                paket: '',
                tanggalKirimInput: '',
                tanggalKirim: '',
                totalHarga: 0,
                detailPaket: [],
                statusProgress: []
            };
            this.selectedPaketDetail = null;
        },
        
        onPaketChange() {
            if (this.newDO.paket) {
                this.selectedPaketDetail = this.paketOptions.find(p => p.nama === this.newDO.paket);
                if (this.selectedPaketDetail) {
                    this.newDO.totalHarga = this.selectedPaketDetail.totalHarga;
                    this.newDO.detailPaket = [...this.selectedPaketDetail.items];
                }
            } else {
                this.selectedPaketDetail = null;
                this.newDO.totalHarga = 0;
                this.newDO.detailPaket = [];
            }
        },
        
        async submitNewDO() {
            try {
                // Validate form
                const errors = apiService.validateDeliveryOrder(this.newDO);
                if (errors.length > 0) {
                    this.$emit('show-flash', {
                        type: 'danger',
                        text: 'Error: ' + errors.join(', ')
                    });
                    return;
                }
                
                // Format tanggal kirim
                this.newDO.tanggalKirim = apiService.formatDate(this.newDO.tanggalKirimInput);
                
                // Set initial progress
                this.newDO.statusProgress = [{
                    waktu: new Date().toISOString(),
                    keterangan: 'Pesanan diterima dan sedang diproses'
                }];
                
                // Create new DO with ID
                const newDeliveryOrder = {
                    ...this.newDO,
                    id: Date.now()
                };
                
                this.$emit('add-do', newDeliveryOrder);
                this.$emit('show-flash', {
                    type: 'success',
                    text: `Delivery Order ${newDeliveryOrder.nomorDO} berhasil dibuat`
                });
                
                this.cancelAddForm();
            } catch (error) {
                this.$emit('show-flash', {
                    type: 'danger',
                    text: 'Terjadi kesalahan: ' + error.message
                });
            }
        },
        
        cancelAddForm() {
            this.showAddForm = false;
            this.resetNewDOForm();
        },
        
        // Progress methods
        startAddProgress(orderId) {
            Vue.set(this.showProgressForm, orderId, true);
            Vue.set(this.newProgress, orderId, {
                waktu: new Date().toISOString().slice(0, 16), // Format untuk datetime-local
                keterangan: ''
            });
        },
        
        cancelProgress(orderId) {
            Vue.set(this.showProgressForm, orderId, false);
            Vue.delete(this.newProgress, orderId);
        },
        
        addProgress(orderId) {
            const progress = this.newProgress[orderId];
            if (!progress || !progress.waktu || !progress.keterangan) {
                this.$emit('show-flash', {
                    type: 'warning',
                    text: 'Mohon isi waktu dan keterangan progress'
                });
                return;
            }
            
            // Find the order and add progress
            const order = this.deliveryOrders.find(o => o.id === orderId);
            if (order) {
                order.statusProgress.push({
                    waktu: progress.waktu,
                    keterangan: progress.keterangan
                });
                
                this.$emit('show-flash', {
                    type: 'success',
                    text: 'Progress berhasil ditambahkan'
                });
                
                this.cancelProgress(orderId);
            }
        },
        
        // Utility methods
        formatCurrency(amount) {
            return apiService.formatCurrency(amount);
        },
        
        formatDate(dateString) {
            return apiService.formatDate(dateString);
        },
        
        formatDateTime(dateTimeString) {
            return apiService.formatDateTime(dateTimeString);
        },
        
        // Debounced search
        debouncedSearch() {
            if (this.searchTimeout) {
                clearTimeout(this.searchTimeout);
            }
            this.searchTimeout = setTimeout(() => {
                // Search is automatically triggered by computed property
            }, 300);
        }
    },
    
    async created() {
        // Load initial data
        await this.loadOptions();
    },
    
    beforeDestroy() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
});
