import RegistrationForm from "@/components/RegistrationForm";

export default function ApplyPage() {
  return (
    <div className="py-10">
      <div className="max-w-3xl mx-auto mb-8 text-center">
        <h1 className="text-3xl font-extrabold text-slate-900">Student Application</h1>
        <p className="mt-2 text-slate-500">Fill out your details and carefully select your top 3 course preferences.</p>
      </div>
      <RegistrationForm />
    </div>
  );
}
