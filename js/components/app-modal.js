// App Modal Component
Vue.component('app-modal', {
    template: '#tpl-modal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: 'Konfirmasi'
        },
        message: {
            type: String,
            default: ''
        },
        type: {
            type: String,
            default: 'info', // 'info', 'confirm'
            validator: (value) => ['info', 'confirm'].includes(value)
        }
    },
    watch: {
        show(newValue) {
            if (newValue) {
                document.body.style.overflow = 'hidden';
            } else {
                document.body.style.overflow = '';
            }
        }
    },
    methods: {
        handleConfirm() {
            this.$emit('confirm');
        },
        handleCancel() {
            this.$emit('cancel');
        }
    },
    mounted() {
        // Handle ESC key
        const handleEsc = (e) => {
            if (e.key === 'Escape' && this.show) {
                this.handleCancel();
            }
        };
        
        document.addEventListener('keydown', handleEsc);
        
        // Cleanup on unmount
        this.$once('hook:beforeDestroy', () => {
            document.removeEventListener('keydown', handleEsc);
            document.body.style.overflow = '';
        });
    }
});
