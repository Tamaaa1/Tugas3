// Stock Table Component
Vue.component('ba-stock-table', {
    template: '#tpl-stock',
    props: {
        items: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            // Filter states
            filters: {
                upbjj: '',
                kategori: '',
                condition: ''
            },
            searchTerm: '',
            sortBy: '',
            sortDirection: 'asc',
            
            // Form states
            showAddForm: false,
            editingItem: null,
            formData: {
                kode: '',
                judul: '',
                kategori: '',
                upbjj: '',
                lokasiRak: '',
                harga: 0,
                qty: 0,
                safety: 0,
                status: 'aktif',
                catatanHTML: ''
            },
            
            // Options
            upbjjOptions: [],
            
            // UI states
            loading: false
        };
    },
    computed: {
        filteredItems() {
            let result = [...this.items];
            
            // Apply search
            if (this.searchTerm) {
                result = apiService.searchBahanAjar(result, this.searchTerm);
            }
            
            // Apply filters
            if (this.filters.upbjj) {
                result = apiService.filterByUpbjj(result, this.filters.upbjj);
            }
            
            if (this.filters.kategori) {
                result = apiService.filterByKategori(result, this.filters.kategori);
            }
            
            if (this.filters.condition) {
                result = apiService.filterByStockCondition(result, this.filters.condition);
            }
            
            // Apply sorting
            if (this.sortBy) {
                result = apiService.sortItems(result, this.sortBy, this.sortDirection);
            }
            
            return result;
        },
        
        availableKategori() {
            if (!this.filters.upbjj) return [];
            const filteredByUpbjj = apiService.filterByUpbjj(this.items, this.filters.upbjj);
            return apiService.getUniqueCategories(filteredByUpbjj);
        }
    },
    watch: {
        // Watcher untuk dependent filter
        'filters.upbjj'(newValue) {
            if (!newValue) {
                this.filters.kategori = '';
            }
        },
        
        // Watcher untuk search dengan debounce
        searchTerm: {
            handler: function(newValue) {
                this.debouncedSearch();
            },
            deep: true
        }
    },
    methods: {
        // API methods
        async loadUpbjjOptions() {
            try {
                this.upbjjOptions = await apiService.getUpbjjOptions();
            } catch (error) {
                console.error('Error loading UPBJJ options:', error);
            }
        },
        
        // Filter methods
        onUpbjjChange() {
            this.filters.kategori = '';
        },
        
        applySearch() {
            // Search sudah otomatis karena computed property
        },
        
        clearSearch() {
            this.searchTerm = '';
        },
        
        applySorting() {
            // Toggle direction if same sort field
            if (this.sortBy) {
                this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
            }
        },
        
        resetFilters() {
            this.filters = {
                upbjj: '',
                kategori: '',
                condition: ''
            };
            this.searchTerm = '';
            this.sortBy = '';
            this.sortDirection = 'asc';
        },
        
        // Form methods
        resetForm() {
            this.formData = {
                kode: '',
                judul: '',
                kategori: '',
                upbjj: '',
                lokasiRak: '',
                harga: 0,
                qty: 0,
                safety: 0,
                status: 'aktif',
                catatanHTML: ''
            };
        },
        
        editItem(item) {
            this.editingItem = { ...item };
            this.formData = { ...item };
            this.showAddForm = false;
        },
        
        cancelForm() {
            this.showAddForm = false;
            this.editingItem = null;
            this.resetForm();
        },
        
        async submitForm() {
            try {
                // Validate form
                const errors = apiService.validateBahanAjar(this.formData);
                if (errors.length > 0) {
                    this.$emit('show-flash', {
                        type: 'danger',
                        text: 'Error: ' + errors.join(', ')
                    });
                    return;
                }
                
                if (this.editingItem) {
                    // Update existing item
                    const updatedItem = { ...this.formData, id: this.editingItem.id };
                    this.$emit('update-item', updatedItem);
                    this.$emit('show-flash', {
                        type: 'success',
                        text: 'Bahan ajar berhasil diperbarui'
                    });
                } else {
                    // Add new item
                    const newItem = { 
                        ...this.formData, 
                        id: Date.now() // Simple ID generation
                    };
                    this.$emit('add-item', newItem);
                    this.$emit('show-flash', {
                        type: 'success',
                        text: 'Bahan ajar berhasil ditambahkan'
                    });
                }
                
                this.cancelForm();
            } catch (error) {
                this.$emit('show-flash', {
                    type: 'danger',
                    text: 'Terjadi kesalahan: ' + error.message
                });
            }
        },
        
        confirmDelete(item) {
            this.$parent.showModal({
                title: 'Konfirmasi Hapus',
                message: `Apakah Anda yakin ingin menghapus bahan ajar:<br/><strong>${item.kode} - ${item.judul}</strong>?`,
                type: 'confirm',
                onConfirm: () => {
                    this.$emit('delete-item', item.id);
                    this.$emit('show-flash', {
                        type: 'success',
                        text: 'Bahan ajar berhasil dihapus'
                    });
                    this.$parent.closeModal();
                }
            });
        },
        
        // Utility methods
        formatCurrency(amount) {
            return apiService.formatCurrency(amount);
        },
        
        formatQuantity(qty) {
            return apiService.formatQuantity(qty);
        },
        
        getQtyClass(qty, safety) {
            const status = apiService.getStockStatus(qty, safety);
            switch (status) {
                case 'kosong': return 'qty-danger';
                case 'menipis': return 'qty-warning';
                case 'aman': return 'qty-safe';
                default: return '';
            }
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
        await this.loadUpbjjOptions();
    },
    
    beforeDestroy() {
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
    }
});
