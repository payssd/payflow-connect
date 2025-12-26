export function PaymentGatewaysSection() {
  const gateways = [
    { name: 'Paystack', description: 'Cards & bank transfers' },
    { name: 'Flutterwave', description: 'Pan-African payments' },
    { name: 'Pesapal', description: 'Multi-channel payments' },
    { name: 'M-Pesa', description: 'Mobile money' },
    { name: 'Bank Transfer', description: 'Direct deposits' },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-semibold text-foreground mb-4">
            Use payment providers you already trust
          </h2>
          <p className="text-lg text-muted-foreground">
            Connect your existing accounts. No new signups. No forced switches.
          </p>
        </div>

        {/* Gateway cards */}
        <div className="flex flex-wrap justify-center gap-4 max-w-3xl mx-auto">
          {gateways.map((gateway, index) => (
            <div
              key={index}
              className="bg-card rounded-lg px-6 py-4 border border-border text-center min-w-[160px]"
            >
              <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                <span className="text-lg font-medium text-foreground">
                  {gateway.name.charAt(0)}
                </span>
              </div>
              <h3 className="font-medium text-foreground text-sm">{gateway.name}</h3>
              <p className="text-xs text-muted-foreground">{gateway.description}</p>
            </div>
          ))}
        </div>

        <p className="text-center text-muted-foreground mt-8 text-sm max-w-md mx-auto">
          Your customers pay through your existing accounts. Money goes directly to you.
        </p>
      </div>
    </section>
  );
}
