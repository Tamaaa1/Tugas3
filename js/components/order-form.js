// Order Form Component
Vue.component('order-form', {
    template: '#tpl-order',
    props: {
        bahanAjarList: {
            type: Array,
            required: true
        }
    },
    data() {
        return {
            // Main order form
            orderForm: {
                nim: '',
                nama: '',
                alamat: '',
                kota: '',
                kodePos: '',
                email: '',
                telepon: '',
                ekspedisi: '',
                metodePembayaran: '',
                catatan: ''
            },
            
            // Item selection
            selectedItems: [],
            itemQuantities: {},
            
            // Filters for item selection
            itemFilter: {
                upbjj: '',
                kategori: '',
                search: ''
            },
            
            // Order history (simulasi)
            orderHistory: [],
            
            // UI states
            loading: false
        };
    },
    computed: {
        filteredBahanAjar() {
            let result = this.bahanAjarList.filter(item => 
                item.status === 'aktif' && item.qty > 0
            );
            
            // Apply filters
            if (this.itemFilter.upbjj) {
                result = result.filter(item => item.upbjj === this.itemFilter.upbjj);
            }
            
            if (this.itemFilter.kategori) {
                result = result.filter(item => item.kategori === this.itemFilter.kategori);
            }
            
            if (this.itemFilter.search) {
                const searchTerm = this.itemFilter.search.toLowerCase();
                result = result.filter(item =>
                    item.kode.toLowerCase().includes(searchTerm) ||
                    item.judul.toLowerCase().includes(searchTerm) ||
                    item.kategori.toLowerCase().includes(searchTerm)
                );
            }
            
            return result;
        },
        
        uniqueUpbjj() {
            const upbjjList = this.bahanAjarList
                .filter(item => item.status === 'aktif' && item.qty > 0)
                .map(item => item.upbjj);
            return [...new Set(upbjjList)].sort();
        },
        
        uniqueKategori() {
            const kategoriList = this.bahanAjarList
                .filter(item => item.status === 'aktif' && item.qty > 0)
                .map(item => item.kategori);
            return [...new Set(kategoriList)].sort();
        },
        
        totalHarga() {
            return this.selectedItems.reduce((total, item) => {
                const qty = this.itemQuantities[item.id] || 1;
                return total + (item.harga * qty);
            }, 0);
        },
        
        totalQuantity() {
            return this.selectedItems.reduce((total, item) => {
                const qty = this.itemQuantities[item.id] || 1;
                return total + qty;
            }, 0);
        },
        
        estimatedShipping() {
            // Estimasi ongkir berdasarkan ekspedisi dan jumlah item
            const baseShipping = {
                'JNE': 15000,
                'TIKI': 18000,
                'POS Indonesia': 12000,
                'Sicepat': 14000,
                'J&T': 13000
            };
            
            const base = baseShipping[this.orderForm.ekspedisi] || 15000;
            const itemCount = this.selectedItems.length;
            const additionalCost = Math.max(0, (itemCount - 1) * 5000);
            
            return base + additionalCost;
        }
    },
    watch: {
        // Watch for selected items changes
        selectedItems: {
            handler: function(newValue) {
                // Initialize quantities for new items
                newValue.forEach(item => {
                    if (!this.itemQuantities[item.id]) {
                        Vue.set(this.itemQuantities, item.id, 1);
                    }
                });
                
                // Remove quantities for unselected items
                Object.keys(this.itemQuantities).forEach(itemId => {
                    const isSelected = newValue.some(item => item.id == itemId);
                    if (!isSelected) {
                        Vue.delete(this.itemQuantities, itemId);
                    }
                });
            },
            deep: true
        }
    },
    methods: {
        // Form validation
        validateOrderForm() {
            const errors = [];
            
            if (!this.orderForm.nim || !/^\d{9}$/.test(this.orderForm.nim)) {
                errors.push('NIM harus 9 digit angka');
            }
            
            if (!this.orderForm.nama.trim()) {
                errors.push('Nama lengkap wajib diisi');
            }
            
            if (!this.orderForm.alamat.trim()) {
                errors.push('Alamat wajib diisi');
            }
            
            if (!this.orderForm.kota.trim()) {
                errors.push('Kota wajib diisi');
            }
            
            if (!this.orderForm.kodePos || !/^\d{5}$/.test(this.orderForm.kodePos)) {
                errors.push('Kode pos harus 5 digit angka');
            }
            
            if (!this.orderForm.email || !/\S+@\S+\.\S+/.test(this.orderForm.email)) {
                errors.push('Email tidak valid');
            }
            
            if (!this.orderForm.telepon.trim()) {
                errors.push('No. telepon wajib diisi');
            }
            
            if (!this.orderForm.ekspedisi) {
                errors.push('Ekspedisi wajib dipilih');
            }
            
            if (!this.orderForm.metodePembayaran) {
                errors.push('Metode pembayaran wajib dipilih');
            }
            
            if (this.selectedItems.length === 0) {
                errors.push('Minimal pilih 1 bahan ajar');
            }
            
            // Validate quantities
            const invalidQty = this.selectedItems.find(item => {
                const qty = this.itemQuantities[item.id] || 1;
                return qty < 1 || qty > item.qty;
            });
            
            if (invalidQty) {
                errors.push(`Quantity untuk ${invalidQty.kode} tidak valid`);
            }
            
            return errors;
        },
        
        // Item selection methods
        isItemSelected(item) {
            return this.selectedItems.some(selected => selected.id === item.id);
        },
        
        calculateTotal() {
            // Total akan otomatis terhitung via computed property
        },
        
        // Order submission
        async submitOrder() {
            try {
                // Validate form
                const errors = this.validateOrderForm();
                if (errors.length > 0) {
                    this.$emit('show-flash', {
                        type: 'danger',
                        text: 'Error: ' + errors.join(', ')
                    });
                    return;
                }
                
                // Create order object
                const order = {
                    id: `ORD-${Date.now()}`,
                    ...this.orderForm,
                    items: this.selectedItems.map(item => ({
                        ...item,
                        qty: this.itemQuantities[item.id] || 1,
                        subtotal: item.harga * (this.itemQuantities[item.id] || 1)
                    })),
                    subtotal: this.totalHarga,
                    ongkir: this.estimatedShipping,
                    total: this.totalHarga + this.estimatedShipping,
                    tanggalPesan: new Date().toISOString(),
                    status: 'pending'
                };
                
                // Add to history
                this.orderHistory.unshift({
                    id: order.id,
                    nama: order.nama,
                    tanggal: apiService.formatDate(order.tanggalPesan),
                    status: 'Pending',
                    itemCount: order.items.length,
                    ekspedisi: order.ekspedisi,
                    total: order.total,
                    metodePembayaran: this.getPaymentMethodText(order.metodePembayaran)
                });
                
                // Keep only last 5 orders in history
                if (this.orderHistory.length > 5) {
                    this.orderHistory = this.orderHistory.slice(0, 5);
                }
                
                this.$emit('create-order', order);
                this.$emit('show-flash', {
                    type: 'success',
                    text: `Pesanan ${order.id} berhasil dibuat dengan total ${this.formatCurrency(order.total)}`
                });
                
                // Reset form
                this.resetOrderForm();
                
            } catch (error) {
                this.$emit('show-flash', {
                    type: 'danger',
                    text: 'Terjadi kesalahan: ' + error.message
                });
            }
        },
        
        // Form reset
        resetOrderForm() {
            this.orderForm = {
                nim: '',
                nama: '',
                alamat: '',
                kota: '',
                kodePos: '',
                email: '',
                telepon: '',
                ekspedisi: '',
                metodePembayaran: '',
                catatan: ''
            };
            this.selectedItems = [];
            this.itemQuantities = {};
            this.itemFilter = {
                upbjj: '',
                kategori: '',
                search: ''
            };
        },
        
        // Utility methods
        formatCurrency(amount) {
            return apiService.formatCurrency(amount);
        },
        
        getPaymentMethodText(method) {
            const methods = {
                'transfer': 'Transfer Bank',
                'cod': 'Cash on Delivery',
                'ewallet': 'E-Wallet',
                'credit': 'Kartu Kredit'
            };
            return methods[method] || method;
        }
    },
    
    created() {
        // Initialize with some sample order history
        this.orderHistory = [];
    }
});
