declare module 'react-native-razorpay' {
  export type RazorpayCheckoutOptions = {
    key: string;
    amount: string;
    currency: string;
    name: string;
    description?: string;
    image?: string;
    order_id: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
    };
    theme?: {
      color?: string;
    };
  };

  export type RazorpayPaymentSuccess = {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  };

  const RazorpayCheckout: {
    open(
      options: RazorpayCheckoutOptions,
      successCallback?: (data: RazorpayPaymentSuccess) => void,
      errorCallback?: (error: { code?: string | number; description?: string }) => void,
    ): Promise<RazorpayPaymentSuccess>;
  };

  export default RazorpayCheckout;
}
