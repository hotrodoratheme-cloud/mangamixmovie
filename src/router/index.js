import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', redirect: '/phim' },
      {
        path: 'phim/danh-muc/:type',
        name: 'movie-list',
        component: () => import('@/views/MovieCategoryView.vue'),
      },
      {
        path: 'phim/the-loai/:slug',
        name: 'movie-genre',
        component: () => import('@/views/MovieCategoryView.vue'),
      },
      {
        path: 'phim/:slug',
        name: 'movie-detail',
        component: () => import('@/views/MovieDetailView.vue'),
      },
      {
        path: 'phim',
        name: 'movie-search',
        component: () => import('@/views/MovieSearchView.vue'),
      },
      {
        path: 'truyen-vn/the-loai/:slug',
        name: 'truyen-vn-genre',
        component: () => import('@/views/TruyenVnCategoryView.vue'),
      },
      {
        path: 'truyen-vn/danh-muc/:type',
        name: 'truyen-vn-list',
        component: () => import('@/views/TruyenVnCategoryView.vue'),
      },
      {
        path: 'truyen-vn/:slug/doc',
        name: 'truyen-vn-reader',
        component: () => import('@/views/TruyenVnReaderView.vue'),
      },
      {
        path: 'truyen-vn/:slug',
        name: 'truyen-vn-detail',
        component: () => import('@/views/TruyenVnDetailView.vue'),
      },
      {
        path: 'truyen-vn',
        name: 'truyen-vn-search',
        component: () => import('@/views/TruyenVnSearchView.vue'),
      },
      {
        path: 'truyen/the-loai/:tagId',
        name: 'manga-genre',
        component: () => import('@/views/MangaCategoryView.vue'),
      },
      {
        path: 'truyen/:id/doc',
        name: 'manga-reader',
        component: () => import('@/views/MangaReaderView.vue'),
      },
      {
        path: 'truyen/:id',
        name: 'manga-detail',
        component: () => import('@/views/MangaDetailView.vue'),
      },
      {
        path: 'truyen',
        name: 'manga-search',
        component: () => import('@/views/MangaSearchView.vue'),
      },
      {
        path: 'lich-su',
        name: 'history',
        component: () => import('@/views/HistoryView.vue'),
      },
      {
        path: 'tai-khoan',
        name: 'account',
        component: () => import('@/views/AccountView.vue'),
      },
      {
        path: 'dat-lai-mat-khau',
        name: 'reset-password',
        component: () => import('@/views/ResetPasswordView.vue'),
      },
    ],
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior() {
    return { top: 0 }
  },
})

export default router
