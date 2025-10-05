#pragma once

#include <glad/glad.h>

#include <glm.hpp>
#include <gtc/type_ptr.hpp>

#include <iostream>
#include <string>
#include <sstream>
#include <fstream>

class Shader
{
public:
    unsigned int ID;
    std::string vertexPath;
    std::string fragmentPath;

    Shader(const char* vertexPath, const char* fragmentPath) : vertexPath(vertexPath), fragmentPath(fragmentPath), ID(0)
    {
        compile();
    }

    ~Shader() {
        if (ID != 0) {
            glDeleteProgram(ID);
        }
    }

    bool compile()
    {
        std::string vertexCode;
        std::string fragmentCode;
        std::ifstream vShaderFile;
        std::ifstream fShaderFile;
        vShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
        fShaderFile.exceptions(std::ifstream::failbit | std::ifstream::badbit);
        try
        {
            vShaderFile.open(vertexPath);
            fShaderFile.open(fragmentPath);
            std::stringstream vShaderStream, fShaderStream;

            vShaderStream << vShaderFile.rdbuf();
            fShaderStream << fShaderFile.rdbuf();

            vShaderFile.close();
            fShaderFile.close();

            vertexCode = vShaderStream.str();
            fragmentCode = fShaderStream.str();
        }
        catch (std::ifstream::failure e)
        {
            std::cout << "ERROR::SHADER::FILE_NOT_SUCCESFULLY_READ" << std::endl;
            return false;
        }
        const char* vShaderCode = vertexCode.c_str();
        const char* fShaderCode = fragmentCode.c_str();

        unsigned int vertex, fragment;
        int success;
        char infoLog[512];


        vertex = glCreateShader(GL_VERTEX_SHADER);
        glShaderSource(vertex, 1, &vShaderCode, NULL);
        glCompileShader(vertex);

        glGetShaderiv(vertex, GL_COMPILE_STATUS, &success);
        if (!success)
        {
            glGetShaderInfoLog(vertex, 512, NULL, infoLog);
            std::cout << "ERROR::SHADER::VERTEX::COMPILATION_FAILED\n" << infoLog << std::endl;
            glDeleteShader(vertex);
            return false;
        };

        fragment = glCreateShader(GL_FRAGMENT_SHADER);
        glShaderSource(fragment, 1, &fShaderCode, NULL);
        glCompileShader(fragment);
        glGetShaderiv(fragment, GL_COMPILE_STATUS, &success);
        if (!success)
        {
            glGetShaderInfoLog(fragment, 512, NULL, infoLog);
            std::cout << "ERROR::SHADER::FRAGMENT::COMPILATION_FAILED\n" << infoLog << std::endl;
            glDeleteShader(vertex);
            glDeleteShader(fragment);
            return false;
        };

        unsigned int newID = glCreateProgram();
        glAttachShader(newID, vertex);
        glAttachShader(newID, fragment);
        glLinkProgram(newID);

        glGetProgramiv(newID, GL_LINK_STATUS, &success);
        if (!success)
        {
            glGetProgramInfoLog(newID, 512, NULL, infoLog);
            std::cout << "ERROR::SHADER::PROGRAM::LINKING_FAILED\n" << infoLog << std::endl;
            glDeleteShader(vertex);
            glDeleteShader(fragment);
            glDeleteProgram(newID);
            return false;
        }

        if (ID != 0)
        {
            glDeleteProgram(ID);
        }
        ID = newID;
        glDeleteShader(vertex);
        glDeleteShader(fragment);
        std::cout << "Shaders compiled successfully" << std::endl;
        return true;
    }

    bool reload() 
    {
        std::cout << "Reloading shaders" << std::endl;
        bool success = compile();
        return success;
    }

    void use() { if(ID!=0) glUseProgram(ID); }
    void setBool(const std::string& name, bool value) const
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), (int)value);
    }
    void setInt(const std::string& name, int value) const
    {
        glUniform1i(glGetUniformLocation(ID, name.c_str()), value);
    }
    void setFloat(const std::string& name, float value) const
    {
        glUniform1f(glGetUniformLocation(ID, name.c_str()), value);
    }
    void setMat4(const std::string& name, glm::mat4 value) const
    {
        glUniformMatrix4fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, glm::value_ptr(value));
    }
    void setMat3(const std::string& name, glm::mat4 value) const
    {
        glUniformMatrix3fv(glGetUniformLocation(ID, name.c_str()), 1, GL_FALSE, glm::value_ptr(value));
    }
    void setVec3(const std::string& name, float x, float y, float z) const
    {
        glUniform3f(glGetUniformLocation(ID, name.c_str()), x, y, z);
    }
    void setVec3(const std::string& name, glm::vec3 value) const
    {
        glUniform3f(glGetUniformLocation(ID, name.c_str()), value.x, value.y, value.z);
    }

};
