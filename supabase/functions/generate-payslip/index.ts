import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PayslipRequest {
  payrollItemId: string;
  payrollRunId: string;
}

serve(async (req: Request) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { payrollItemId, payrollRunId }: PayslipRequest = await req.json();

    if (!payrollItemId || !payrollRunId) {
      return new Response(
        JSON.stringify({ error: "payrollItemId and payrollRunId are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch payroll run details
    const { data: payrollRun, error: runError } = await supabase
      .from("payroll_runs")
      .select("*, organization:organizations(*)")
      .eq("id", payrollRunId)
      .single();

    if (runError || !payrollRun) {
      console.error("Error fetching payroll run:", runError);
      return new Response(
        JSON.stringify({ error: "Payroll run not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch payroll item with employee details
    const { data: payrollItem, error: itemError } = await supabase
      .from("payroll_items")
      .select("*, employee:employees(*)")
      .eq("id", payrollItemId)
      .single();

    if (itemError || !payrollItem) {
      console.error("Error fetching payroll item:", itemError);
      return new Response(
        JSON.stringify({ error: "Payroll item not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const employee = payrollItem.employee;
    const organization = payrollRun.organization;

    // Generate HTML payslip
    const payslipHtml = generatePayslipHtml({
      organization,
      employee,
      payrollRun,
      payrollItem,
    });

    return new Response(
      JSON.stringify({ 
        success: true, 
        html: payslipHtml,
        data: {
          employee: {
            name: `${employee.first_name} ${employee.last_name}`,
            email: employee.email,
            employee_number: employee.employee_number,
            department: employee.department,
            job_title: employee.job_title,
          },
          payrollRun: {
            name: payrollRun.name,
            pay_period_start: payrollRun.pay_period_start,
            pay_period_end: payrollRun.pay_period_end,
            payment_date: payrollRun.payment_date,
          },
          earnings: {
            basic_salary: payrollItem.basic_salary,
            housing_allowance: payrollItem.housing_allowance || 0,
            transport_allowance: payrollItem.transport_allowance || 0,
            other_allowances: payrollItem.other_allowances || 0,
            gross_pay: payrollItem.gross_pay,
          },
          deductions: {
            paye: payrollItem.paye || 0,
            nhif: payrollItem.nhif || 0,
            nssf: payrollItem.nssf || 0,
            other_deductions: payrollItem.other_deductions || 0,
            total_deductions: payrollItem.total_deductions || 0,
          },
          net_pay: payrollItem.net_pay,
        }
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Error generating payslip:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function generatePayslipHtml(data: {
  organization: any;
  employee: any;
  payrollRun: any;
  payrollItem: any;
}) {
  const { organization, employee, payrollRun, payrollItem } = data;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: payrollRun.currency || "USD",
    }).format(amount || 0);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-KE", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Payslip - ${employee.first_name} ${employee.last_name}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #f5f5f5; padding: 20px; }
    .payslip { max-width: 800px; margin: 0 auto; background: white; padding: 40px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
    .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #7c3aed; padding-bottom: 20px; margin-bottom: 30px; }
    .company-info h1 { color: #7c3aed; font-size: 24px; margin-bottom: 5px; }
    .company-info p { color: #666; font-size: 12px; }
    .payslip-title { text-align: right; }
    .payslip-title h2 { color: #333; font-size: 20px; }
    .payslip-title p { color: #666; font-size: 14px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .info-section h3 { color: #7c3aed; font-size: 14px; text-transform: uppercase; margin-bottom: 15px; border-bottom: 1px solid #eee; padding-bottom: 5px; }
    .info-row { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 14px; }
    .info-row .label { color: #666; }
    .info-row .value { color: #333; font-weight: 500; }
    .earnings-deductions { display: grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-bottom: 30px; }
    .section { background: #f9f9f9; padding: 20px; border-radius: 8px; }
    .section h3 { color: #333; font-size: 16px; margin-bottom: 15px; }
    .section-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 14px; }
    .section-row:last-child { border-bottom: none; }
    .section-row .label { color: #666; }
    .section-row .value { color: #333; font-weight: 500; }
    .section-total { display: flex; justify-content: space-between; padding: 12px 0; margin-top: 10px; border-top: 2px solid #ddd; font-weight: 600; font-size: 16px; }
    .net-pay { background: linear-gradient(135deg, #7c3aed, #06b6d4); color: white; padding: 25px; border-radius: 8px; text-align: center; margin-bottom: 30px; }
    .net-pay h3 { font-size: 14px; text-transform: uppercase; margin-bottom: 10px; opacity: 0.9; }
    .net-pay .amount { font-size: 32px; font-weight: 700; }
    .footer { text-align: center; color: #999; font-size: 11px; padding-top: 20px; border-top: 1px solid #eee; }
    .footer p { margin-bottom: 5px; }
  </style>
</head>
<body>
  <div class="payslip">
    <div class="header">
      <div class="company-info">
        <h1>${organization.name}</h1>
        <p>${organization.email}</p>
        ${organization.phone ? `<p>${organization.phone}</p>` : ''}
        <p>${organization.country}</p>
      </div>
      <div class="payslip-title">
        <h2>PAYSLIP</h2>
        <p>${payrollRun.name}</p>
        <p>${payrollRun.run_number}</p>
      </div>
    </div>

    <div class="info-grid">
      <div class="info-section">
        <h3>Employee Information</h3>
        <div class="info-row">
          <span class="label">Name</span>
          <span class="value">${employee.first_name} ${employee.last_name}</span>
        </div>
        <div class="info-row">
          <span class="label">Employee No</span>
          <span class="value">${employee.employee_number || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Department</span>
          <span class="value">${employee.department || 'N/A'}</span>
        </div>
        <div class="info-row">
          <span class="label">Job Title</span>
          <span class="value">${employee.job_title || 'N/A'}</span>
        </div>
      </div>
      <div class="info-section">
        <h3>Pay Period</h3>
        <div class="info-row">
          <span class="label">Period Start</span>
          <span class="value">${formatDate(payrollRun.pay_period_start)}</span>
        </div>
        <div class="info-row">
          <span class="label">Period End</span>
          <span class="value">${formatDate(payrollRun.pay_period_end)}</span>
        </div>
        <div class="info-row">
          <span class="label">Payment Date</span>
          <span class="value">${formatDate(payrollRun.payment_date)}</span>
        </div>
      </div>
    </div>

    <div class="earnings-deductions">
      <div class="section">
        <h3>Earnings</h3>
        <div class="section-row">
          <span class="label">Basic Salary</span>
          <span class="value">${formatCurrency(payrollItem.basic_salary)}</span>
        </div>
        <div class="section-row">
          <span class="label">Housing Allowance</span>
          <span class="value">${formatCurrency(payrollItem.housing_allowance || 0)}</span>
        </div>
        <div class="section-row">
          <span class="label">Transport Allowance</span>
          <span class="value">${formatCurrency(payrollItem.transport_allowance || 0)}</span>
        </div>
        <div class="section-row">
          <span class="label">Other Allowances</span>
          <span class="value">${formatCurrency(payrollItem.other_allowances || 0)}</span>
        </div>
        <div class="section-total">
          <span>Gross Pay</span>
          <span>${formatCurrency(payrollItem.gross_pay)}</span>
        </div>
      </div>
      <div class="section">
        <h3>Deductions</h3>
        <div class="section-row">
          <span class="label">PAYE</span>
          <span class="value">${formatCurrency(payrollItem.paye || 0)}</span>
        </div>
        <div class="section-row">
          <span class="label">NHIF</span>
          <span class="value">${formatCurrency(payrollItem.nhif || 0)}</span>
        </div>
        <div class="section-row">
          <span class="label">NSSF</span>
          <span class="value">${formatCurrency(payrollItem.nssf || 0)}</span>
        </div>
        <div class="section-row">
          <span class="label">Other Deductions</span>
          <span class="value">${formatCurrency(payrollItem.other_deductions || 0)}</span>
        </div>
        <div class="section-total">
          <span>Total Deductions</span>
          <span>${formatCurrency(payrollItem.total_deductions || 0)}</span>
        </div>
      </div>
    </div>

    <div class="net-pay">
      <h3>Net Pay</h3>
      <div class="amount">${formatCurrency(payrollItem.net_pay)}</div>
    </div>

    <div class="footer">
      <p>This is a computer-generated payslip. No signature is required.</p>
      <p>Generated on ${new Date().toLocaleDateString("en-KE", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
      <p style="margin-top: 10px; font-style: italic;">PayFlow Africa - We never hold, process, or custody your funds.</p>
    </div>
  </div>
</body>
</html>
  `;
}
