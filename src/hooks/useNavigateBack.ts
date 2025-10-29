import { useCallback } from "react";
import { useLocation, useNavigate, type NavigateOptions } from "react-router";

const useNavigateBack = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigateBack = useCallback(
    (options?: NavigateOptions) => {
      return location.key !== "default" ? navigate(-1) : navigate("/", options);
    },
    [location, navigate]
  );

  return navigateBack;
};

export { useNavigateBack };
