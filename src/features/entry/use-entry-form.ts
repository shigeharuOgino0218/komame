import * as React from "react"

import {
  appendDigit,
  removeLastDigit,
  type DigitKey,
} from "@/features/entry/amount"
import type { Ymd } from "@/lib/date"

const LAST_PAYMENT_METHOD_KEY = "komame:last-payment-method"

export type EntryState = {
  amount: number
  categoryId: string | null
  paymentMethodId: string | null
  /** null = 今日（日付が変わっても自動で追従する） */
  date: Ymd | null
  memo: string
  /** 自由貯金から払う。うっかり払い続けないよう保存のたびにオフに戻す */
  fromSavings: boolean
}

type EntryAction =
  | { type: "digit"; key: DigitKey }
  | { type: "backspace" }
  | { type: "clear" }
  | { type: "toggle-category"; id: string }
  | { type: "toggle-payment-method"; id: string }
  | { type: "set-date"; date: Ymd | null }
  | { type: "set-memo"; memo: string }
  | { type: "toggle-savings" }
  | { type: "reset-after-save" }

function reducer(state: EntryState, action: EntryAction): EntryState {
  switch (action.type) {
    case "digit":
      return { ...state, amount: appendDigit(state.amount, action.key) }
    case "backspace":
      return { ...state, amount: removeLastDigit(state.amount) }
    case "clear":
      return { ...state, amount: 0 }
    case "toggle-category":
      return {
        ...state,
        categoryId: state.categoryId === action.id ? null : action.id,
      }
    case "toggle-payment-method":
      return {
        ...state,
        paymentMethodId: state.paymentMethodId === action.id ? null : action.id,
      }
    case "set-date":
      return { ...state, date: action.date }
    case "set-memo":
      return { ...state, memo: action.memo }
    case "toggle-savings":
      return { ...state, fromSavings: !state.fromSavings }
    case "reset-after-save":
      // 支払方法は次回も使うことが多いので残す。日付は取り違え防止のため今日に戻す
      return {
        amount: 0,
        categoryId: null,
        paymentMethodId: state.paymentMethodId,
        date: null,
        memo: "",
        fromSavings: false,
      }
  }
}

function readLastPaymentMethod(): string | null {
  try {
    return localStorage.getItem(LAST_PAYMENT_METHOD_KEY)
  } catch {
    return null
  }
}

export function rememberPaymentMethod(id: string | null) {
  try {
    if (id) {
      localStorage.setItem(LAST_PAYMENT_METHOD_KEY, id)
    } else {
      localStorage.removeItem(LAST_PAYMENT_METHOD_KEY)
    }
  } catch {
    // 保存できなくても入力は続けられる
  }
}

export function useEntryForm() {
  return React.useReducer(reducer, undefined, () => ({
    amount: 0,
    categoryId: null,
    paymentMethodId: readLastPaymentMethod(),
    date: null,
    memo: "",
    fromSavings: false,
  }))
}
