import { useState, useCallback } from 'react'

export interface ValidationRule {
  required?: boolean
  min?: number
  max?: number
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | null
}

export interface ValidationRules {
  [key: string]: ValidationRule
}

export interface ValidationErrors {
  [key: string]: string
}

export interface FormValidationResult {
  values: Record<string, any>
  errors: ValidationErrors
  isValid: boolean
  touched: Record<string, boolean>
  setValue: (field: string, value: any) => void
  setError: (field: string, error: string) => void
  clearError: (field: string) => void
  validateField: (field: string) => boolean
  validateAll: () => boolean
  reset: (initialValues?: Record<string, any>) => void
  touch: (field: string) => void
  touchAll: () => void
}

export function useFormValidation(
  initialValues: Record<string, any> = {},
  validationRules: ValidationRules = {}
): FormValidationResult {
  const [values, setValues] = useState<Record<string, any>>(initialValues)
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback((field: string): boolean => {
    const value = values[field]
    const rules = validationRules[field]
    
    if (!rules) return true

    // Required validation
    if (rules.required && (value === undefined || value === null || value === '')) {
      setErrors(prev => ({ ...prev, [field]: 'This field is required' }))
      return false
    }

    // Skip other validations if field is empty and not required
    if (!rules.required && (value === undefined || value === null || value === '')) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      return true
    }

    // Min/Max validation for numbers
    if (typeof value === 'number') {
      if (rules.min !== undefined && value < rules.min) {
        setErrors(prev => ({ ...prev, [field]: `Value must be at least ${rules.min}` }))
        return false
      }
      if (rules.max !== undefined && value > rules.max) {
        setErrors(prev => ({ ...prev, [field]: `Value must be at most ${rules.max}` }))
        return false
      }
    }

    // MinLength/MaxLength validation for strings
    if (typeof value === 'string') {
      if (rules.minLength !== undefined && value.length < rules.minLength) {
        setErrors(prev => ({ ...prev, [field]: `Must be at least ${rules.minLength} characters` }))
        return false
      }
      if (rules.maxLength !== undefined && value.length > rules.maxLength) {
        setErrors(prev => ({ ...prev, [field]: `Must be at most ${rules.maxLength} characters` }))
        return false
      }
    }

    // Pattern validation
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value)) {
      setErrors(prev => ({ ...prev, [field]: 'Invalid format' }))
      return false
    }

    // Custom validation
    if (rules.custom) {
      const customError = rules.custom(value)
      if (customError) {
        setErrors(prev => ({ ...prev, [field]: customError }))
        return false
      }
    }

    // Clear error if validation passes
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
    return true
  }, [values, validationRules])

  const validateAll = useCallback((): boolean => {
    const fields = Object.keys(validationRules)
    let isValid = true
    
    fields.forEach(field => {
      if (!validateField(field)) {
        isValid = false
      }
    })
    
    return isValid
  }, [validateField, validationRules])

  const setValue = useCallback((field: string, value: any) => {
    setValues(prev => ({ ...prev, [field]: value }))
    
    // Validate field if it has been touched
    if (touched[field]) {
      setTimeout(() => validateField(field), 0)
    }
  }, [touched, validateField])

  const setError = useCallback((field: string, error: string) => {
    setErrors(prev => ({ ...prev, [field]: error }))
  }, [])

  const clearError = useCallback((field: string) => {
    setErrors(prev => {
      const newErrors = { ...prev }
      delete newErrors[field]
      return newErrors
    })
  }, [])

  const touch = useCallback((field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }))
  }, [])

  const touchAll = useCallback(() => {
    const fields = Object.keys(validationRules)
    const touchedFields = fields.reduce((acc, field) => {
      acc[field] = true
      return acc
    }, {} as Record<string, boolean>)
    setTouched(touchedFields)
  }, [validationRules])

  const reset = useCallback((newInitialValues?: Record<string, any>) => {
    const resetValues = newInitialValues || initialValues
    setValues(resetValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  const isValid = Object.keys(errors).length === 0

  return {
    values,
    errors,
    isValid,
    touched,
    setValue,
    setError,
    clearError,
    validateField,
    validateAll,
    reset,
    touch,
    touchAll
  }
}