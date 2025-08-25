import React from 'react';
import { Order } from '../data/orderdata';

// 결제 상태 뱃지 렌더링 함수
export const renderPaymentStatusBadge = (order: Order, variant: 'table' | 'card' = 'table') => {
  let label = '';
  let color = '';
  
  if (order.refundStatus === '카드결제취소') {
    label = '카드결제취소';
    color = 'bg-red-100 text-red-600';
  } else if (order.refundStatus === '환불요청') {
    label = '환불요청';
    color = 'bg-orange-100 text-orange-600';
  } else if (order.refundStatus === '계좌입금완료') {
    label = '입금완료';
    color = 'bg-green-100 text-green-600';
  } else if (order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') {
    if (order.confirmStatus === '구매완료') {
      label = '입금완료';
      color = 'bg-green-100 text-green-600';
    } else {
      label = '입금전';
      color = 'bg-yellow-100 text-yellow-600';
    }
  } else if (order.paymentMethod === 'card' || order.paymentMethod === '신용카드') {
    label = '결제완료';
    color = 'bg-blue-50 text-blue-500';
  } else {
    label = '결제완료';
    color = 'bg-blue-50 text-blue-500';
  }
  
  const baseClasses = `text-xs font-semibold px-2 py-1 rounded-full ${color}`;
  const variantClasses = variant === 'table' 
    ? `block w-[80px] mx-auto text-center ${baseClasses}`
    : baseClasses;
    
  return <span className={variantClasses}>{label}</span>;
};

// 주문 상태 뱃지 렌더링 함수
export const renderOrderStatusBadge = (order: Order) => {
  const statusColors = {
    '주문접수': 'bg-blue-100 text-blue-800',
    '진행 중': 'bg-yellow-100 text-yellow-800',
    '작업완료': 'bg-green-100 text-green-800',
    '구매완료': 'bg-purple-100 text-purple-800',
    '작업취소': 'bg-red-100 text-red-800',
    '취소': 'bg-red-100 text-red-800'
  };
  
  const color = statusColors[order.status as keyof typeof statusColors] || 'bg-red-100 text-red-800';
  
  return (
    <div className="flex flex-col gap-1">
      <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>
        {order.status}
      </span>
      {order.confirmStatus && (
        <span className="px-2 py-1 rounded text-xs font-semibold bg-purple-100 text-purple-800">
          {order.confirmStatus}
        </span>
      )}
    </div>
  );
};

// 날짜 필터링 함수
export const filterByDate = (order: Order, startDate: string, endDate: string) => {
  if (!startDate && !endDate) return true;
  
  // 주문 날짜를 Date 객체로 변환 (로컬 시간대 기준)
  const orderDate = new Date(order.date);
  
  // 검색 날짜들을 Date 객체로 변환 (로컬 시간대 기준)
  const start = startDate ? new Date(startDate + 'T00:00:00') : null;
  const end = endDate ? new Date(endDate + 'T23:59:59') : null;
  
  // 날짜만 비교 (시간 제외)
  const orderDateOnly = new Date(orderDate.getFullYear(), orderDate.getMonth(), orderDate.getDate());
  const startDateOnly = start ? new Date(start.getFullYear(), start.getMonth(), start.getDate()) : null;
  const endDateOnly = end ? new Date(end.getFullYear(), end.getMonth(), end.getDate()) : null;
  
  if (startDateOnly && endDateOnly) {
    return orderDateOnly >= startDateOnly && orderDateOnly <= endDateOnly;
  } else if (startDateOnly) {
    return orderDateOnly >= startDateOnly;
  } else if (endDateOnly) {
    return orderDateOnly <= endDateOnly;
  }
  
  return true;
};

// 주문 상태 필터링 함수
export const filterByOrderStatus = (order: Order, statusFilter: string) => {
  if (statusFilter === '전체 상태' || statusFilter === 'all') return true;
  if (statusFilter === '가상계좌발급') {
    return order.paymentMethod === '가상계좌' && (!order.paymentDate || order.paymentDate === '-');
  }
  if (statusFilter === '작업완료') {
    return order.status === '작업완료' && order.confirmStatus !== '구매완료';
  }
  if (statusFilter === '구매완료') {
    return order.status === '작업완료' && order.confirmStatus === '구매완료';
  }
  if (statusFilter === '구매확정') {
    return order.status === '작업완료' && order.confirmStatus !== '구매완료';
  }
  if (statusFilter === '작업취소') {
    return order.status === '작업취소';
  }
  return order.status === statusFilter;
};

// 결제 상태 필터링 함수
export const filterByPaymentStatus = (order: Order, paymentsStatusFilter: string) => {
  if (paymentsStatusFilter === '전체') return true;
  if (paymentsStatusFilter === '입금전') {
    return (order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') && 
           (order.paymentDate === '-' || !order.paymentDate);
  }
  if (paymentsStatusFilter === '입금완료') {
    return (order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') && 
           order.paymentDate && order.paymentDate !== '-';
  }
  if (paymentsStatusFilter === '결제완료') {
    return (order.paymentMethod === 'card' || order.paymentMethod === '신용카드') && 
           order.paymentDate && order.paymentDate !== '-';
  }
  if (paymentsStatusFilter === '환불요청') {
    return order.refundStatus === '환불요청';
  }
  if (paymentsStatusFilter === '결제(입금)완료') {
    const isCardPaymentCompleted = (order.paymentMethod === 'card' || order.paymentMethod === '신용카드') && 
                                  order.paymentDate && order.paymentDate !== '-';
    const isVirtualAccountCompleted = (order.paymentMethod === 'virtual' || order.paymentMethod === '가상계좌') && 
                                     order.confirmStatus === '구매완료';
    return isCardPaymentCompleted || isVirtualAccountCompleted;
  }
  return true;
};

// 주문 현황 카운트 계산 함수들
export const calculateOrderCounts = (orderList: Order[]) => {
  const virtualAccountIssued = orderList.filter((o: Order) => 
    (o.paymentMethod === 'virtual' || o.paymentMethod === '가상계좌') && 
    (!o.paymentDate || o.paymentDate === '-')
  ).length;
  
  const paymentCompleted = orderList.filter((o: Order) => {
    const isCardPaymentCompleted = (o.paymentMethod === 'card' || o.paymentMethod === '신용카드') && 
                                  o.paymentDate && o.paymentDate !== '-';
    const isVirtualAccountCompleted = (o.paymentMethod === 'virtual' || o.paymentMethod === '가상계좌') && 
                                     o.confirmStatus === '구매완료';
    return isCardPaymentCompleted || isVirtualAccountCompleted;
  }).length;
  
  const orderInProgress = orderList.filter((o: Order) => o.status === '진행 중').length;
  const orderWorkCompleted = orderList.filter((o: Order) => o.status === '작업완료' && o.confirmStatus !== '구매완료').length;
  const orderPurchaseCompleted = orderList.filter((o: Order) => o.status === '작업완료' && o.confirmStatus === '구매완료').length;
  const orderCanceled = orderList.filter((o: Order) => o.status === '취소').length;
  
  return {
    virtualAccountIssued,
    paymentCompleted,
    orderInProgress,
    orderWorkCompleted,
    orderPurchaseCompleted,
    orderCanceled
  };
};

// 결제내역 입금전 건수 계산
export const calculatePendingPayments = (paymentList: Order[]) => {
  return paymentList.filter((o: Order) => 
    (o.paymentMethod === 'virtual' || o.paymentMethod === '가상계좌') && 
    o.confirmStatus !== '구매완료'
  ).length;
};

// 환불요청 버튼 표시 조건
export const shouldShowRefundButton = (payment: Order) => {
  return payment.refundStatus !== '환불요청' &&
         !((payment.paymentMethod === 'virtual' || payment.paymentMethod === '가상계좌') && 
           (payment.paymentDate === '-' || !payment.paymentDate));
};

// 페이지네이션 계산 함수
export const calculatePagination = (totalItems: number, currentPage: number, itemsPerPage: number) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  return {
    totalPages,
    startIndex,
    endIndex,
    hasNextPage: currentPage < totalPages,
    hasPrevPage: currentPage > 1
  };
}; 