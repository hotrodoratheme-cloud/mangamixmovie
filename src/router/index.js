import { createRouter, createWebHistory } from 'vue-router'
import AppLayout from '@/components/layout/AppLayout.vue'
import { setPageTitle } from '@/composables/usePageMeta'
import { ACTOR_FILMOGRAPHY_ENABLED } from '@/config/features'

const routes = [
  {
    path: '/',
    component: AppLayout,
    children: [
      { path: '', redirect: '/phim' },
      {
        path: 'phim/danh-muc/:type',
        name: 'movie-list',
        meta: { backTo: '/phim' },
        component: () => import('@/views/MovieCategoryView.vue'),
      },
      {
        path: 'phim/the-loai/:slug',
        name: 'movie-genre',
        meta: { backTo: '/phim' },
        component: () => import('@/views/MovieCategoryView.vue'),
      },
      ...(ACTOR_FILMOGRAPHY_ENABLED
        ? [
            {
              path: 'phim/dien-vien/:tmdbId',
              name: 'actor-filmography',
              meta: { backTo: '/phim', title: 'Diễn viên' },
              component: () => import('@/views/ActorFilmographyView.vue'),
            },
          ]
        : []),
      {
        path: 'phim/:slug',
        name: 'movie-detail',
        meta: { backTo: '/phim' },
        component: () => import('@/views/MovieDetailView.vue'),
      },
      {
        path: 'phim',
        name: 'movie-search',
        meta: { title: 'Phim' },
        component: () => import('@/views/MovieSearchView.vue'),
      },
      {
        path: 'truyen-vn/the-loai/:slug',
        name: 'truyen-vn-genre',
        meta: { backTo: '/truyen-vn' },
        component: () => import('@/views/TruyenVnCategoryView.vue'),
      },
      {
        path: 'truyen-vn/danh-muc/:type',
        name: 'truyen-vn-list',
        meta: { backTo: '/truyen-vn' },
        component: () => import('@/views/TruyenVnCategoryView.vue'),
      },
      {
        path: 'truyen-vn/:slug/doc',
        name: 'truyen-vn-reader',
        meta: { backTo: '/truyen-vn' },
        component: () => import('@/views/TruyenVnReaderView.vue'),
      },
      {
        path: 'truyen-vn/:slug',
        name: 'truyen-vn-detail',
        meta: { backTo: '/truyen-vn' },
        component: () => import('@/views/TruyenVnDetailView.vue'),
      },
      {
        path: 'truyen-vn',
        name: 'truyen-vn-search',
        meta: { title: 'Truyện VN' },
        component: () => import('@/views/TruyenVnSearchView.vue'),
      },
      {
        path: 'truyen/the-loai/:slug',
        name: 'manga-genre',
        meta: { backTo: '/truyen' },
        component: () => import('@/views/MangaCategoryView.vue'),
      },
      {
        path: 'truyen/danh-muc/:type',
        name: 'manga-list',
        meta: { backTo: '/truyen' },
        component: () => import('@/views/MangaCategoryView.vue'),
      },
      {
        path: 'truyen/:id/doc',
        name: 'manga-reader',
        meta: { backTo: '/truyen' },
        component: () => import('@/views/MangaReaderView.vue'),
      },
      {
        path: 'truyen/:id',
        name: 'manga-detail',
        meta: { backTo: '/truyen' },
        component: () => import('@/views/MangaDetailView.vue'),
      },
      {
        path: 'truyen',
        name: 'manga-search',
        meta: { title: 'Truyện MangaDex' },
        component: () => import('@/views/MangaSearchView.vue'),
      },
      {
        path: 'lich-su',
        name: 'history',
        meta: { title: 'Lịch sử' },
        component: () => import('@/views/HistoryView.vue'),
      },
      {
        path: 'tiep-tuc',
        name: 'continue',
        meta: { title: 'Tiếp tục' },
        component: () => import('@/views/ContinueView.vue'),
      },
      {
        path: 'tai-khoan',
        name: 'account',
        meta: { title: 'Tài khoản' },
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

router.onError((error, to) => {
  const message = error?.message || ''
  if (
    message.includes('Failed to fetch dynamically imported module') ||
    message.includes('Importing a module script failed')
  ) {
    const reloadKey = `chunk-reload:${to.fullPath}`
    if (sessionStorage.getItem(reloadKey)) {
      console.error('Không thể tải module sau khi reload:', to.fullPath, error)
      return
    }
    sessionStorage.setItem(reloadKey, '1')
    window.location.assign(to.fullPath)
  }
})

router.afterEach((to) => {
  sessionStorage.removeItem(`chunk-reload:${to.fullPath}`)
  setPageTitle(to.meta?.title || '')
})

export default router
