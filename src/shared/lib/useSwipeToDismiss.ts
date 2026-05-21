import { onUnmounted, watch, type Ref } from 'vue'

export interface SwipeOptions {
  /** Threshold in pixels to trigger dismiss */
  threshold?: number
  /** Callback fired when dismissed */
  onDismiss: () => void
}

export function useSwipeToDismiss(
  elementRef: Ref<HTMLElement | null>,
  options: SwipeOptions
) {
  const threshold = options.threshold ?? 120
  
  let startY = 0
  let currentY = 0
  let isDragging = false

  const onTouchStart = (e: TouchEvent) => {
    // Не перехватываем свайп, если мы скроллим какой-то внутренний контейнер
    let target = e.target as HTMLElement | null
    let canScrollUp = false
    
    while (target && target !== elementRef.value) {
      if (target.scrollHeight > target.clientHeight && target.scrollTop > 0) {
        canScrollUp = true
        break
      }
      target = target.parentElement
    }
    
    if (canScrollUp) return

    startY = e.touches[0].clientY
    isDragging = true
    
    if (elementRef.value) {
      elementRef.value.style.transition = 'none'
    }
  }

  const onTouchMove = (e: TouchEvent) => {
    if (!isDragging) return
    const dy = e.touches[0].clientY - startY
    
    // Разрешаем только свайп вниз
    if (dy > 0) {
      currentY = dy
      // e.preventDefault() можно раскомментировать, если нужно заблокировать скролл страницы под модалкой,
      // но в большинстве случаев это вызывает ошибки в консоли (passive event listener).
      
      if (elementRef.value) {
        elementRef.value.style.transform = `translateY(${dy}px)`
      }
    }
  }

  const onTouchEnd = () => {
    if (!isDragging) return
    isDragging = false
    
    if (elementRef.value) {
      elementRef.value.style.transition = 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
      
      if (currentY > threshold) {
        // Уводим вниз за экран
        elementRef.value.style.transform = `translateY(100vh)`
        
        setTimeout(() => {
          options.onDismiss()
          // Возвращаем в исходное положение для будущих открытий (сброс)
          if (elementRef.value) {
            elementRef.value.style.transform = ''
          }
          currentY = 0
        }, 300)
      } else {
        // Возвращаем на место (недостаточно потянули)
        elementRef.value.style.transform = ''
        currentY = 0
      }
    }
  }

  const attachEvents = (el: HTMLElement) => {
    el.addEventListener('touchstart', onTouchStart, { passive: true })
    el.addEventListener('touchmove', onTouchMove, { passive: true })
    el.addEventListener('touchend', onTouchEnd)
  }

  const detachEvents = (el: HTMLElement) => {
    el.removeEventListener('touchstart', onTouchStart)
    el.removeEventListener('touchmove', onTouchMove)
    el.removeEventListener('touchend', onTouchEnd)
  }

  watch(elementRef, (newEl, oldEl) => {
    if (oldEl) detachEvents(oldEl)
    if (newEl) attachEvents(newEl)
  }, { immediate: true })

  onUnmounted(() => {
    if (elementRef.value) {
      detachEvents(elementRef.value)
    }
  })
}
