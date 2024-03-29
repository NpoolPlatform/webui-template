import { AxiosInstance, AxiosResponse } from 'axios'
import { Cookies } from 'quasar'
import { useLocalUserStore } from '../mystore/appuser/user/local'
import { useSettingStore } from '../mystore/setting'
import { API as LoginedAPI } from '../mystore/appuser/user/const'
import { LoginedResponse } from '../mystore/appuser/user/types'
import {
  NavigationGuardNext,
  RouteLocationNormalized
} from 'vue-router'
import { createAPI } from '../mystore/request'

interface RouteMetaImpl {
  ShowHeaderAnnouncement: boolean
  ShowMainHeader: boolean
  ShowBigLogo: boolean
  ShowSignHelper: boolean
  ShowFooterTop: boolean
  ShowTopTip: boolean
  NeedLogined: boolean
}

declare module 'vue-router' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface RouteMeta extends RouteMetaImpl {
  }
}

const loginInterceptor = (signInPath: string, to: RouteLocationNormalized, next: NavigationGuardNext) => {
  const setting = useSettingStore()
  setting.ShowHeaderAnnouncement = to.meta.ShowHeaderAnnouncement
  setting.ShowMainHeader = to.meta.ShowMainHeader
  setting.ShowBigLogo = to.meta.ShowBigLogo
  setting.ShowSignHelper = to.meta.ShowSignHelper
  setting.ShowFooterTop = to.meta.ShowFooterTop
  setting.ShowTopTip = to.meta.ShowTopTip

  const user = useLocalUserStore()
  if (user.User) {
    next()
    return
  }

  const userID = Cookies.get('X-User-ID')
  const token = Cookies.get('X-App-Login-Token')
  if (!userID || !token || userID.length === 0 || token.length === 0) {
    if (to.meta && to.meta.NeedLogined) {
      next({ path: signInPath, replace: true })
    } else {
      next()
    }
    return
  }

  const api = createAPI() as AxiosInstance

  const headers = api.defaults.headers as unknown as Record<string, string>
  headers['X-User-ID'] = userID
  headers['X-App-Login-Token'] = token

  api.post<unknown, AxiosResponse<LoginedResponse>>(LoginedAPI.LOGINED)
    .then((resp: AxiosResponse<LoginedResponse>) => {
      user.User = resp.data.Info
      if (!user.User && to.meta && to.meta.NeedLogined) {
        next({ path: signInPath, replace: true })
        return
      }
      next()
    }).catch(() => {
      if (to.meta && to.meta.NeedLogined) {
        next({ path: signInPath, replace: true })
      } else {
        next()
      }
    })
}

export {
  loginInterceptor,
  RouteMetaImpl
}
