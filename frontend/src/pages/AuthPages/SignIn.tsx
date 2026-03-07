import PageMeta from "../../components/common/PageMeta";
import AuthLayout from "./AuthPageLayout";
import SignInForm from "../../components/auth/SignInForm";

export default function SignIn() {
  return (
    <>
      <PageMeta
        title="Administrador Dashboard Capuchinos"
        description="Administrador Dashboard Capuchinos"
      />
      <AuthLayout>
        <SignInForm />
      </AuthLayout>
    </>
  );
}
