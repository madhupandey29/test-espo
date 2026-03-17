"use client";
import { useEffect, useState } from "react";
import Wrapper from "@/layout/wrapper";
import ErrorMsg from "../common/error-msg";
import { useRouter } from "next/navigation";
import { notifySuccess } from "@/utils/toast";
import { confirmEmail } from "@/lib/auth-client";

export default function EmailVerifyArea({ token }) {
  const router = useRouter();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const isSuccess = Boolean(data) && !error;

  useEffect(() => {
    let isActive = true;

    setIsLoading(true);
    setData(null);
    setError(null);

    confirmEmail(token)
      .then((response) => {
        if (!isActive) {
          return;
        }

        setData(response);
      })
      .catch((requestError) => {
        if (!isActive) {
          return;
        }

        setError(requestError);
      })
      .finally(() => {
        if (isActive) {
          setIsLoading(false);
        }
      });

    return () => {
      isActive = false;
    };
  }, [token]);

  useEffect(() => {
    if (isSuccess) {
      router.push("/");
      notifySuccess("Register Success!");
    }
  }, [router, isSuccess]);

  return (
    <Wrapper>
      <div
        className="d-flex align-items-center justify-content-center"
        style={{ height: "100vh" }}
      >
        {isLoading ? (
          <h3>Loading ....</h3>
        ) : isSuccess ? (
          <h2>{data?.message}</h2>
        ) : (
          <ErrorMsg msg={error?.data?.error || error?.message} />
        )}
      </div>
    </Wrapper>
  );
}
