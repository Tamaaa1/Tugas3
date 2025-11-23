// CRUD Modal Component
Vue.component('crud-modal', {
    template: '#tpl-crud-modal',
    props: {
        show: {
            type: Boolean,
            default: false
        },
        title: {
            type: String,
            default: 'Form'
        },
        titleIcon: {
            type: String,
            default: 'fas fa-edit'
        },
        submitText: {
            type: String,
            default: 'Simpan'
        },
        loading: {
            type: Boolean,
            default: false
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
    beforeDestroy() {
        document.body.style.overflow = '';
    }
});
