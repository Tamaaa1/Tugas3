// Status Badge Component
Vue.component('status-badge', {
    template: '#tpl-status',
    props: {
        qty: {
            type: Number,
            required: true
        },
        safety: {
            type: Number,
            required: true
        },
        tooltip: {
            type: String,
            default: ''
        }
    },
    computed: {
        statusClass() {
            if (this.qty === 0) return 'kosong';
            if (this.qty < this.safety) return 'menipis';
            return 'aman';
        },
        statusText() {
            if (this.qty === 0) return 'Kosong';
            if (this.qty < this.safety) return 'Menipis';
            return 'Aman';
        },
        tooltipText() {
            let baseTooltip = `Qty: ${this.qty}, Safety: ${this.safety}`;
            if (this.tooltip) {
                return `${baseTooltip}\n\n${this.tooltip.replace(/<[^>]*>/g, '')}`;
            }
            return baseTooltip;
        }
    },
    mounted() {
        // Initialize Bootstrap tooltip jika ada
        if (window.bootstrap && this.tooltip) {
            const tooltipTrigger = this.$el;
            new bootstrap.Tooltip(tooltipTrigger, {
                html: true,
                placement: 'top'
            });
        }
    }
});
